---
layout: post
title: "Single-node MongoDB Replica Set with Docker Compose for Local Development & Testing"
description: "Unlock the advanced features of MongoDB locally with a single-node replica set using Docker Compose to seamlessly develop and test."
toc: false
tags:
  - Linux
  - MongoDB
  - MongoDB Replica Set
  - Docker
  - Python
  - pymongo
---

Some of the MongoDB features (e.g., transactions) are only available with a replica set. But what if you're working locally, running just a single MongoDB instance with Docker Compose? Fortunately, you can initialize a single-node replica set with just one MongoDB instance, and I'll guide you through the process in the following sections.

## Approach

While one of the most common ways to automatically initialize MongoDB replica set is to use Docker's [healthcheck](https://docs.docker.com/engine/reference/builder/#healthcheck) feature (see the references section in the end), this approach might not be the most optimal. The main reason is that healthchecks are not designed to perform initialization procedures crucial for components that depend on them.

I would like to present an alternative approach where the initialization of a replica set occurs within another application's entrypoint script, running in a separate container. Typically, I use this script to wait for a database (in this particular case, MongoDB) to be fully initialized and ready to accept connections. This entrypoint script can easily be extended to initialize MongoDB replica set as well.

Consider a scenario where we have an app running in a separate container that connects to MongoDB. For the sake of illustration, I'll use Python and `pymongo` within an entrypoint script, but you may use whatever you want.

## Implementation

Let's start with `docker-compose.yml`. Our first task is to modify the MongoDB service command to integrate it into a replica set. Additionally, we'll configure our Python app service to run in a foreground, doing nothing (just like many of us):

```yaml
version: "3.9"

services:
  mongo:
    image: mongo:7
    command: ["mongod", "--replSet", "rs0"]

  app:
    build:
      context: .
      dockerfile: ./Dockerfile
    environment:
      - DEBUG=1
      - MONGO_URL=mongodb://mongo:27017
    command: ["python", "-c", "while True: pass"]
```

Take a closer look at the `app` environment variables. These variables will play a crucial role in our subsequent steps.

For illustration, here's a simple Dockerfile for a Python app (requiring the installation of `pymongo`):

```dockerfile
FROM python:3.10-slim-bookworm

RUN pip install --upgrade pip pymongo

COPY ./entrypoint /entrypoint
RUN chmod +x /entrypoint

ENTRYPOINT ["/entrypoint"]
```

### Entrypoint Script

The entrypoint script is designed to perform the following tasks:

1. Attempt to establish a connection with MongoDB.
2. If the connection is successful, execute a command to initialize a replica set. Any errors arising from replica set initialization (e.g., if it's already initialized) will be suppressed.
3. If the initial connection attempt fails, the script will wait for 1 second and retry until a successful connection with MongoDB is established.

```shell
#!/bin/bash

set -o errexit
set -o nounset

# Define an inline Python function to deal with MongoDB.
mongo_ready() {
python << END
import sys

from pymongo import MongoClient, errors

# Bash will substitute variables in square brackets.
DEBUG = bool(int("${DEBUG}"))

# Try to connect to MongoDB. 'ServerSelectionTimeoutError' will be raised in case of an error.
try:
    # It's essential to pass the 'directConnection' flag.
    client = MongoClient("${MONGO_URL}", directConnection=True)
    try:
        # Try to initialize a replica set. 'OperationFailure' will be raised if it's already done.
        rs_init_output = client.admin.command(
            "replSetInitiate",
            # We use the 'rs0' name for the replica set & add only one existing MongoDB host to it.
            {"_id": "rs0", "members": [{"_id": 0, "host": "mongo:27017"}]}
        )
        if DEBUG:
            sys.stdout.write(f"Replica set init status: {rs_init_output}\n")
    except errors.OperationFailure as e:
        if DEBUG:
            # Log the error if replica set initialization fails.
            sys.stderr.write(f"{e}\n")
    if DEBUG:
        sys.stdout.write(f"{client.server_info()}\n")
except errors.ServerSelectionTimeoutError as e:
    # Return a non-zero exit code if the connection fails to let
    # the outer bash script know that it needs to retry.
    sys.exit(-1)
sys.exit(0)
END
}

# Run our function to connect to MongoDB & init a replica set.
until mongo_ready; do
  >&2 echo 'Waiting for MongoDB to become available...'
  # In case of non-zero exit code wait 1 second before run the connection function again.
  sleep 1
done
>&2 echo 'MongoDB is available.'

# Execute a provided command.
exec "$@"
```

There is a Python function from the script above:

```python
import sys

from pymongo import MongoClient, errors

# Bash will substitute variables in square brackets.
DEBUG = bool(int("${DEBUG}"))

# Try to connect to MongoDB. 'ServerSelectionTimeoutError' will be raised in case of an error.
try:
    # It's essential to pass the 'directConnection' flag.
    client = MongoClient("${MONGO_URL}", directConnection=True)
    try:
        # Try to initialize a replica set. 'OperationFailure' will be raised if it's already done.
        rs_init_output = client.admin.command(
            "replSetInitiate",
            # We use the 'rs0' name for the replica set & add only one existing MongoDB host to it.
            {"_id": "rs0", "members": [{"_id": 0, "host": "mongo:27017"}]}
        )
        if DEBUG:
            sys.stdout.write(f"Replica set init status: {rs_init_output}\n")
    except errors.OperationFailure as e:
        if DEBUG:
            # Log the error if replica set initialization fails.
            sys.stderr.write(f"{e}\n")
    if DEBUG:
        sys.stdout.write(f"{client.server_info()}\n")
except errors.ServerSelectionTimeoutError as e:
    # Return a non-zero exit code if the connection fails to let
    # the outer bash script know that it needs to retry.
    sys.exit(-1)
sys.exit(0)
```

Also, note that the `MONGO_URL` environment variable is missing any replica set references. You need to add `replicaSet=rs0` to the connection string now (the full connection string should look like `mongodb://mongo:27017?replicaSet=rs0`). E.g., for a Python app:

```python
import os

from pymongo import MongoClient

MONGO_URL = f"{os.getenv('MONGO_URL')}?replicaSet=rs0"

client = MongoClient(MONGO_URL)
```

When you run the containers, you should see in the logs (if `DEBUG` is set to `1`), something like:

```text
app-1  | Replica set init status: {'ok': 1.0}
app-1  | {'version': '7.0.4', ...}
app-1  | MongoDB is available.
```

You can clone a [gist](https://gist.github.com/e79d902f931cd9f239542dbaf71d0287.git) containing all the required files mentioned above.

---

References:

* [pymongo: Initializing the Set](https://pymongo.readthedocs.io/en/stable/examples/high_availability.html#initializing-the-set)
* [The only local MongoDB replica set with Docker Compose guide you’ll ever need!](https://medium.com/workleap/the-only-local-mongodb-replica-set-with-docker-compose-guide-youll-ever-need-2f0b74dd8384)
