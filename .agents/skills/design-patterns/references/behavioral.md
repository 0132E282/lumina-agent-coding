# Behavioral Patterns (10 patterns)

Help divide responsibilities, organize algorithms and coordinate communication between objects.

| Pattern | When to use | Backend example |
|---|---|---|
| **Chain of Responsibility** | A request must pass through a chain of handlers; each handler may process, forward or stop the chain. Processing order matters. | Chain of checks: authentication → permission → quota → request handling; a failing step stops the chain. |
| **Command** | Want to encapsulate an operation as an object to pass around, queue, schedule or support undo. | `GenerateReportCommand` holds the request data and is executed later. Undo must be designed separately for the operation. |
| **Iterator** | Want to traverse a collection without the consumer knowing the storage structure or traversal algorithm. | An iterator fetches API pages itself; the export side just iterates records. |
| **Mediator** | Many components call each other, tangling dependencies; need one place to coordinate interactions. | `CheckoutMediator` coordinates cart, inventory and payment; components communicate through the mediator. |
| **Memento** | Need to capture and restore object state without letting outsiders touch internal data. | A page builder saves layout snapshots for undo/redo of edits. |
| **Observer** | One event must notify many subscribers, and receivers should be added or removed with little impact on the emitter. | The order-created event is received by listeners to send email, write logs and update statistics. |
| **State** | Same operation but behavior differs by state; state logic and transitions are getting complex. | `Order::cancel()` behaves differently when the order is pending, paid or shipping. |
| **Strategy** | Multiple algorithms for the same task and a need to choose or swap them. | Compute discounts with `PercentageDiscount`, `FixedDiscount`, `MemberDiscount`. |
| **Template Method** | Many processes share the same step skeleton but differ in how some steps are done; want to fix the common sequence. | `BaseImporter` runs read → validate → normalize → save; CSV and XML importers override the read step. |
| **Visitor** | A structure of fairly stable object types, but new operations are often added on them. | A form's field tree accepts `ValidationVisitor`, `DocumentationVisitor`, `ExportVisitor`; each visitor handles each field type. Adding a new field type usually means changing the visitors. |
