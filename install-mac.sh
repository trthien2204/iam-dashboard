#!/bin/bash
echo "============================================="
echo "   CÀI ĐẶT IT HELPDESK AGENT CHO MACOS"
echo "============================================="

# 1. Tải file về thư mục tạm (dùng link tải agent-macos của mày)
echo "[*] Đang tải lõi Agent từ hệ thống..."
curl -L -o /tmp/agent-macos "https://github.com/trthien2204/iam-dashboard/releases/download/v1.0.0/agent-macos" > /dev/null 2>&1

# 2. Cấp ấn kiếm và tát vỡ mồm Gatekeeper
echo "[*] Đang bẻ khóa bảo mật Apple Gatekeeper..."
chmod +x /tmp/agent-macos
sudo xattr -rd com.apple.quarantine /tmp/agent-macos 2>/dev/null

# 3. Chạy luôn!
echo "[+] Kích hoạt Agent (Vui lòng nhập mật khẩu máy Mac nếu được hỏi):"
sudo /tmp/agent-macos
