# Laravel + React notes

- Trace route → middleware/guard → FormRequest → policy/gate → service/query → resource; never treat route model binding as a permission check.
- For dynamic CRUD, allowlist module/model/action/field/relation and apply permissions per object. Check export/bulk/download separately.
- Check `$request->all()`, fill/create/update, `$fillable`/`$guarded`; validated input still needs permission to edit business fields.
- Check `whereRaw`/`orderByRaw`/`DB::raw`; bind values and allowlist identifiers.
- Distinguish Sanctum cookie session from bearer token; apply CSRF and cookies suited to the actual mechanism.
- Check `APP_DEBUG`, storage disk visibility, signed route, trusted proxies and rate limiter by version.
- Check `VITE_*` variables since they ship to the client; check `dangerouslySetInnerHTML` and rich-text sanitizer.
- Do not change stack or version because of one example; read project code before proposing.
