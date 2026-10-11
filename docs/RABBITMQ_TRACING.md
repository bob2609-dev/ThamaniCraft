# RabbitMQ Tracing & RabbitScout Setup

This guide explains how to properly configure RabbitMQ tracing so that you can view the complete message history in RabbitScout, and how to ensure this configuration survives container restarts.

## Why were traces disappearing?

By default, RabbitMQ stores its configuration and data in ephemeral storage within the container. When the container was restarted or rebuilt, the entire database (including your queues, bindings, and active traces) was wiped clean.

*(Note: We have updated the `docker-compose.yml` to include a persistent volume for RabbitMQ, so any setup you do now will survive restarts!)*

---

## Setup Procedure

To ensure RabbitScout can display all message history, we need to configure RabbitMQ first, and then view the messages in RabbitScout.

### Phase 1: RabbitMQ Side Configuration

#### Step 1: Enable Tracing via the Admin Tab
The `rabbitmq_tracing` plugin is pre-installed. We need to activate a trace to capture all messages.

1. Open the **RabbitMQ Management UI** at [http://localhost:15672](http://localhost:15672).
2. Log in (default is `guest` / `guest`).
3. Navigate to the **Admin** tab in the top menu.
4. On the right-hand sidebar, click on **Tracing**.
5. Under the **Add a new trace** section:
   - **Name**: Enter `rabbitscout_trace` (or any name you prefer).
   - **Format**: Select `JSON`.
   - **Pattern**: Enter `#` (the hash symbol is a wildcard that captures *all* messages).
6. Click **Add trace**. 

*(Note: Adding this trace automatically enables the internal Firehose Tracer under the hood, so you no longer need to run CLI commands to turn it on!)*

#### Step 2: Create a Persistent Queue for History
While the Admin trace captures messages, we need a permanent queue to hold them so RabbitScout can read them at any time.

1. Navigate to the **Queues** tab.
2. Under the **Add a new queue** section:
   - **Type**: `Classic` (or `Quorum`).
   - **Name**: `rabbitscout.history`.
   - Leave other settings as default and click **Add queue**.

#### Step 3: Bind the Queue to the Trace Exchange
1. Navigate to the **Exchanges** tab.
2. Click on the exchange named `amq.rabbitmq.trace` (this was created automatically when you enabled tracing).
3. Expand the **Bindings** section.
4. Under "Add binding from this exchange":
   - **To queue**: Enter `rabbitscout.history`.
   - **Routing key**: Enter `#`.
   - Click **Bind**.

---

### Phase 2: RabbitScout Side

Now that RabbitMQ is capturing and storing all messages persistently, you can view them in RabbitScout.

1. Open **RabbitScout** in your browser at [http://localhost:3035](http://localhost:3035).
2. On the left sidebar, look at your list of **Queues**.
3. Click on the `rabbitscout.history` queue.
4. You will now see **all historical messages** stored safely in this queue! You can browse past events (like `BatchCompleted`, `OrderFulfillment`, etc.) as they happen, and they will remain there even if you close the browser or restart the system.
