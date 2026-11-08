# Structural Patterns (7 patterns)

Help combine objects and classes while staying easy to change and extend.

| Pattern | When to use | Backend example |
|---|---|---|
| **Adapter** | Want to use a library or system whose interface is incompatible with the interface the app uses. | Wrap an external payment SDK into `PaymentGatewayInterface` with `pay()` and `refund()`. |
| **Bridge** | Two independently varying dimensions; inheriting every combination makes the class count explode. | Separate report types `SalesReport`, `InventoryReport` from renderers `PdfRenderer`, `HtmlRenderer`; combinable freely. |
| **Composite** | Data is tree-structured and you want to handle single elements and groups through the same interface. | `Field` and `FieldGroup` both have `validate()`; the group recursively calls down into child fields and groups. |
| **Decorator** | Need to add behavior via composable wrapper classes while keeping the object's interface. | Wrap the notification service with `LoggingNotifier`, then `RetryNotifier`. |
| **Facade** | A subsystem has many components and call steps; want to give consumers one simple interface. | `InvoiceFacade::issue()` hides creating the invoice, building the PDF, saving the file and sending the email. |
| **Flyweight** | Very many identical objects, repeated data pressures RAM; the immutable part can be extracted and shared. | Tens of thousands of fields in a document builder reference one font definition instead of each holding a copy. |
| **Proxy** | Need a stand-in object to control access, defer initialization or talk to a remote service. | `ProtectedDocumentProxy` checks permission before forwarding the call to the document reading service. |
