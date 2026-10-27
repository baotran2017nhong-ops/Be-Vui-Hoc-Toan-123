# Be Vui Hoc Toan 123

Website trò chơi toán tương tác cho trẻ mầm non, được xây dựng bằng HTML, CSS và JavaScript.

## Cách chạy trên máy local

1. Tải hoặc clone repo này.
2. Mở thư mục dự án.
3. Chạy một server tĩnh bằng Python hoặc một công cụ khác.

### Ví dụ dùng Python

```bash
cd Be-Vui-Hoc-Toan-123
python -m http.server 8000
```

Sau đó mở trong trình duyệt:

```text
http://localhost:8000
```

## Triển khai lên Vercel

1. Đăng nhập vào Vercel.
2. Chọn "Add New Project".
3. Import repo này.
4. Giữ nguyên cấu hình mặc định của Vercel cho project static.
5. Click "Deploy".

Vercel sẽ tự động build và deploy website static từ các tệp `index.html`, `style.css` và `script.js`.

## Ghi chú

- Không cần cài đặt dependency để chạy.
- Dự án đã hỗ trợ responsive cho điện thoại và máy tính.
- Có giọng đọc bằng Web Speech API của trình duyệt.
- Tất cả trò chơi đều có chế độ Dễ (0–10) và Nâng cao (10–20).

## Cấu trúc file

```text
Be-Vui-Hoc-Toan-123/
├── index.html
├── style.css
├── script.js
├── README.md
└── DEPLOY.md
```

## Mô tả trò chơi

- Đếm đồ vật, nhận biết chữ số, phép cộng, so sánh số lượng
- Đồng hồ kim và đồng hồ điện tử
- Kéo thả vị trí: trên, dưới, trong, ngoài, trái, phải, trước, sau
- Tìm số còn thiếu bằng dấu gạch ngang
- Nghe đọc số và chọn số đúng
- Chọn đúng số lượng đồ vật theo số cho trước

Chúc bé học vui vẻ và tiến bộ từng ngày! 
