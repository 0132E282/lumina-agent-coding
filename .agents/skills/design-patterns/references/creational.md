# Creational Patterns (5 patterns)

Help control how objects are created, especially when instantiation has many variants or configurations.

| Pattern | When to use | Backend example |
|---|---|---|
| **Factory Method** | A parent class has a common process but needs subclasses to decide the type of object created. Useful when building libraries with extension points. | `BaseExporter` calls `createWriter()`; `CsvExporter` and `PdfExporter` return the matching writer. |
| **Abstract Factory** | Need to create a set of related objects, ensuring they belong to the same variant and are compatible. | `PaymentProviderFactory` creates the payment client, refund client and webhook verifier together for the same provider. |
| **Builder** | A complex object with many optional parameters or built in multiple steps. | Build a report config with `withColumns()`, `withFilters()`, `withRelations()`, then `build()`. |
| **Prototype** | Need to create objects by copying a configured template; consumers should not depend on the concrete class. | Clone a sample CRUD module's config then change the name, data fields and permissions. Must clearly define what is deep-copied and what is shared. |
| **Singleton** | A shared instance is truly needed program-wide with one consistent access point. | A shared config registry within the process. **Not** the same as "a single instance across all servers"; use with care since global state makes testing harder. |
