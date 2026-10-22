# HTML to Component

Khi tách component, giữ invariant frontend/type và checklist DRY/readability trong [`coding-standards`](../../coding-standards/SKILL.md); không tạo abstraction ngoài nhu cầu hiện tại.

Chuyển HTML/CSS tĩnh có sẵn trong project thành component của framework người dùng chỉ định, giữ đúng nội dung/layout/hành vi quan sát được trong file nguồn — không redesign, không đổi nội dung, không tự thêm tính năng.

## Phạm vi

- Input: file `.html`/`.css` (và `.js` nếu có) **đã có sẵn trong repository**. Không áp dụng cho ảnh, URL hoặc design reference — các trường hợp đó dùng [clone-website](../../clone-website/SKILL.md)/`ui-cloner`.
- Target framework do người dùng chỉ định mỗi lần (React, Vue, Angular, Svelte...); không tự chọn mặc định. Chưa rõ framework đích thì hỏi trước khi convert.
- Giữ nguyên nội dung, layout, style, text và hành vi JS quan sát được trong file nguồn, cùng nguyên tắc với [frontend](../../../rules/frontend.md). Nếu file nguồn là kết quả của một lần clone trước đó, áp dụng thêm [ràng buộc fidelity của clone-website](../../clone-website/SKILL.md#ràng-buộc-fidelity) khi đối chiếu.

## Quy trình

1. **Đọc convention project đích trước khi convert**: thư mục component (`components/`, `src/components`...), naming file/component, TS hay JS, cách style đang dùng (CSS Module, Tailwind, styled-components...). Convert theo đúng convention đã quan sát được, không áp đặt chuẩn riêng.
2. **Đọc toàn bộ file nguồn**: HTML, CSS liên quan (inline `<style>` hoặc file `.css` được link) và JS liên quan (inline `<script>` hoặc file `.js` được link). Không convert khi chưa đọc hết nguồn.
3. **Xác định khối lặp/UI pattern** (card, list item, table row, nav item...) để tách thành component riêng có props; phần không lặp giữ ở component cha. Áp dụng [rule DRY](../../../rules/coding.md#nguyên-tắc-code) — chỉ tách khi thật sự lặp ≥2 lần hoặc đã nhìn rõ pattern, không tách phòng xa.
4. **Tách hàm/logic dùng chung**: đoạn xử lý lặp lại (format dữ liệu, tính class name, event handler tương tự) rút thành hàm/hook riêng theo idiom framework đích (hook cho React, composable cho Vue, service cho Angular...). Giữ đúng hành vi JS gốc, không tự thêm logic mới.
5. **Chuyển đổi theo idiom framework đích**: attribute HTML → prop/binding tương ứng (`class` → `className`/`:class`, `onclick` → `onClick`/`@click`...). CSS giữ nguyên cơ chế style project đích đang dùng; không tự đổi sang CSS-in-JS nếu project đang dùng CSS Module và ngược lại.
6. **Tối ưu render khi áp dụng được cho framework đích**: `key` ổn định cho list, memoization (`React.memo`/`useMemo`/`computed`...) cho phần tính toán lặp lại hoặc re-render thừa đã quan sát được. Không tối ưu khi chưa có dấu hiệu cần — tránh tối ưu sớm theo [simplicity](../../../rules/coding.md#kiss-yagni-và-phạm-vi).
7. **Đối chiếu fidelity**: so sánh file gốc và component mới — cùng nội dung, cùng cấu trúc hiển thị, cùng hành vi tương tác. Có sai khác phải sửa hoặc báo rõ vị trí/lý do, không tự coi là "cải tiến".

## Kiểm tra trước khi hoàn thành

- Component mới hiển thị đúng nội dung/layout/style như file HTML/CSS gốc, đối chiếu trực tiếp (không suy đoán).
- Hành vi JS gốc (click, toggle, submit...) hoạt động tương đương sau khi chuyển sang event handler của framework đích.
- Tên file/component, vị trí thư mục và cách style khớp convention project đích đã quan sát ở bước 1.
- Không có TODO/placeholder che phần chưa chuyển; phần chưa chuyển được phải báo rõ, không âm thầm bỏ qua.
- Lint/type-check của project đích (nếu có) pass; áp dụng [type-safety](../../../rules/coding.md#an-toàn-type) khi target TypeScript.

## Không áp dụng

- Không tự thêm data fetching, state quản lý toàn cục, route hoặc backend call không có trong file gốc.
- Không tự đổi UI library/CSS framework (Tailwind, MUI...) nếu project đích chưa dùng sẵn.
- Nhiều file HTML cùng lúc có phần dùng chung rõ ràng (header/footer lặp ở mọi trang): hỏi người dùng có muốn tách layout chung trước khi convert từng trang, không tự quyết.

## Skill liên quan

- [clone-website](../../clone-website/SKILL.md) khi nguồn là ảnh/URL/sitemap chứ không phải file HTML có sẵn trong project.
- [coding-frontend](../SKILL.md) cho phần triển khai còn lại (nối data thật, SEO, accessibility) sau khi đã có component.
- [design-patterns](../../design-patterns/references/refactoring.md) khi cần kỹ thuật refactor cụ thể hơn cho bước tách hàm/component.
- [testing](../../testing/references/unit-testing.md) khi cần viết test cho component/hàm vừa tách.
