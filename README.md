# DATN - ERP System Dashboard

Giao diện người dùng (Single Page Application) cho hệ thống Đồ Án Tốt Nghiệp - Quản trị Doanh nghiệp (ERP System), được xây dựng tối ưu tốc độ bằng Vite, quản lý chặt chẽ bằng TypeScript và tổ chức theo kiến trúc Feature-Sliced Design (FSD).

## 🛠️ Công nghệ sử dụng
* **Core:** React 19+ (TypeScript)
* **Build Tool:** Vite 8.x
* **Styling:** SASS / Vanilla CSS
* **State Management:** Redux Toolkit (React Redux)
* **HTTP Client:** Axios (kết nối với Django REST API)
* **Routing:** React Router DOM
* **Form & Validation:** React Hook Form & Zod
* **Table:** TanStack Table (`shared/ui/DataTable`)
* **Icons:** Lucide React
* **Testing:** Vitest & React Testing Library

## 📦 Cấu trúc Thư mục Chính (Feature-Sliced Design)
Dự án áp dụng phương pháp thiết kế Feature-Sliced Design (FSD) giúp phân chia mã nguồn rõ ràng, dễ bảo trì và mở rộng:

```text
datn_frontend/
├── src/
│   ├── app/          # Bootstrap dự án, global providers, router và styles
│   ├── assets/       # Hình ảnh, icon và tài nguyên tĩnh
│   ├── config/       # Cấu hình dự án (ví dụ: API endpoints...)
│   ├── entities/     # Thực thể nghiệp vụ cốt lõi (User, Product, Order...) chứa slices, types, API cơ bản
│   ├── features/     # Logic tương tác của người dùng (Đăng nhập, Bộ lọc, Form thao tác...)
│   ├── lib/          # Cấu hình cài đặt cho các thư viện bên thứ ba
│   ├── pages/        # Các trang giao diện chính (Login, Dashboard, Products...)
│   ├── processes/    # Các quy trình nghiệp vụ phức tạp đi qua nhiều trang/bước
│   ├── shared/       # Các thành phần UI dùng chung (Button, DataTable, Form...), helpers, httpClient
│   ├── widgets/      # Các khối giao diện kết hợp lớn (Sidebar, Header, các Chart Dashboard...)
│   ├── main.tsx      # Điểm bắt đầu (Entry point) của ứng dụng React
│   └── setupTests.ts # Cấu hình môi trường chạy kiểm thử frontend
├── .env.example      # File mẫu cấu hình biến môi trường
├── package.json      # Danh sách thư viện và script quản trị dự án
└── tsconfig.json     # Cấu hình TypeScript
```

## 🚀 Hướng dẫn Cài đặt & Chạy Local

### 1. Yêu cầu hệ thống
* Node.js phiên bản 18.x hoặc 20.x trở lên.
* Trình quản lý gói `npm` (đi kèm Node.js) hoặc `yarn`.

### 2. Các bước triển khai

**Bước 1: Clone repository và di chuyển vào thư mục frontend**
```bash
git clone [URL_REPO_FRONTEND]
cd datn_frontend
```

**Bước 2: Cài đặt các Node Modules**
```bash
npm install
# Hoặc nếu dùng yarn: yarn install
```

**Bước 3: Cấu hình biến môi trường**
* Tạo file `.env` tại thư mục gốc của frontend.
* Sao chép nội dung từ file `.env.example` và điều chỉnh URL trỏ tới API của Django (mặc định chạy ở cổng 8000):
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

**Bước 4: Chạy dự án ở chế độ Development**
```bash
npm run dev
# Hoặc: yarn dev
```
Mở trình duyệt và truy cập: `http://localhost:5173/` (hoặc cổng được hiển thị trên terminal).

**Bước 5: Kiểm thử ứng dụng (Testing)**
Dự án được cấu hình kiểm thử bằng Vitest và React Testing Library:
```bash
# Chạy toàn bộ tests bằng terminal
npm run test

# Chạy tests với giao diện UI tương tác trực quan
npm run test:ui
```

**Bước 6: Build dự án cho Production (Khi cần deploy)**
```bash
npm run build
```
Sản phẩm sau khi build sẽ nằm trong thư mục `/dist` sẵn sàng để triển khai.
