"""AI Task Processing Platform - background worker.

Consumes task IDs pushed by the Node/Express API onto a Redis list
(BLPOP), loads the task from MongoDB, runs the requested operation,
and writes back status/result/logs. Designed to run as N replicas
(see k8s/worker-hpa.yaml) since it holds no local state.
"""

import logging
import os
import signal
import sys
import time
from datetime import datetime, timezone

import redis
from bson import ObjectId
from pymongo import MongoClient
from pymongo.errors import PyMongoError

from operations import run_operation

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [worker] %(levelname)s %(message)s",
)
log = logging.getLogger(__name__)

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/ai_task_platform")
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
QUEUE_KEY = os.getenv("TASK_QUEUE_KEY", "ai_tasks:queue")
BLPOP_TIMEOUT_SECONDS = int(os.getenv("BLPOP_TIMEOUT_SECONDS", "5"))

_running = True


def _handle_shutdown(signum, frame):  # noqa: ARG001
    global _running
    log.info("Shutdown signal received, finishing current task then exiting")
    _running = False


signal.signal(signal.SIGTERM, _handle_shutdown)
signal.signal(signal.SIGINT, _handle_shutdown)


def connect_redis() -> redis.Redis:
    return redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)


def connect_mongo():
    client = MongoClient(MONGO_URI)
    db = client.get_default_database()
    return db.tasks


def process_task(tasks_collection, task_id: str) -> None:
    try:
        task = tasks_collection.find_one({"_id": ObjectId(task_id)})
    except Exception as exc:  # invalid id format etc.
        log.error("Could not parse task id %s: %s", task_id, exc)
        return

    if not task:
        log.warning("Task %s not found (may have been deleted)", task_id)
        return

    now = datetime.now(timezone.utc)
    tasks_collection.update_one(
        {"_id": task["_id"]},
        {
            "$set": {"status": "Running", "startedAt": now},
            "$push": {"logs": "Worker picked up task"},
        },
    )

    try:
        result = run_operation(task["operation"], task["inputText"])
        finished = datetime.now(timezone.utc)
        tasks_collection.update_one(
            {"_id": task["_id"]},
            {
                "$set": {
                    "status": "Success",
                    "result": result,
                    "finishedAt": finished,
                },
                "$push": {"logs": "Operation completed successfully"},
            },
        )
        log.info("Task %s completed (%s)", task_id, task["operation"])
    except Exception as exc:
        finished = datetime.now(timezone.utc)
        tasks_collection.update_one(
            {"_id": task["_id"]},
            {
                "$set": {"status": "Failed", "finishedAt": finished},
                "$push": {"logs": f"Error: {exc}"},
            },
        )
        log.error("Task %s failed: %s", task_id, exc)


def main() -> int:
    log.info("Starting worker. Mongo=%s Redis=%s:%s Queue=%s", MONGO_URI, REDIS_HOST, REDIS_PORT, QUEUE_KEY)

    tasks_collection = connect_mongo()
    r = connect_redis()

    while _running:
        try:
            item = r.blpop(QUEUE_KEY, timeout=BLPOP_TIMEOUT_SECONDS)
            if item is None:
                continue  # timeout, loop again so we can react to shutdown signal
            _, task_id = item
            process_task(tasks_collection, task_id)
        except PyMongoError as exc:
            log.error("MongoDB error, retrying in 3s: %s", exc)
            time.sleep(3)
        except redis.exceptions.RedisError as exc:
            log.error("Redis error, retrying in 3s: %s", exc)
            time.sleep(3)

    log.info("Worker stopped cleanly")
    return 0


if __name__ == "__main__":
    sys.exit(main())
