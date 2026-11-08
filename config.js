// ===================================================================
// CẤU HÌNH THÔNG TIN TRANG WEB LỄ TỐT NGHIỆP - MINH KHÁNH
// ===================================================================

const CONFIG = {
  // 1. Thông tin nhân vật
  senderName: "Minh Khánh", // Tên người tốt nghiệp
  recipientName: "Em",      // Người nhận
  
  // 2. Thông tin buổi lễ tốt nghiệp
  graduation: {
    university: "Đại học Công nghiệp Thành phố Hồ Chí Minh",
    faculty: "",
    degree: "Lễ Tốt Nghiệp",
    date: "2026-11-29T09:00:00", // Định dạng: YYYY-MM-DDTHH:mm:ss
    dateDisplay: "Chủ Nhật, ngày 29 tháng 11, 2026",
    timeDisplay: "Từ 09:00 Sáng",
    timeNote: "Mong em đến trước 15p để tránh tụi mình lạc nhau nhé",
    locationName: "Trường Đại học Công nghiệp TP.HCM (IUH)",
    address: "12 Nguyễn Văn Bảo, Hạnh Thông, Hồ Chí Minh",
    googleMapsUrl: "https://www.google.com/maps/place/Tr%C6%B0%E1%BB%9Dng+%C4%90%E1%BA%A1i+h%E1%BB%8Dc+C%C3%B4ng+nghi%E1%BB%87p+TP.HCM/@10.8221733,106.6831931,858m/data=!3m1!1e3!4m15!1m8!3m7!1s0x317528e52e46e0cd:0xe3e53fb545e26265!2zMTIgTmd1eeG7hW4gVsSDbiBC4bqjbywgSOG6oW5oIFRow7RuZywgSOG7kyBDaMOtIE1pbmggNzAwMDAwLCBWaeG7h3QgTmFt!3b1!8m2!3d10.8221733!4d106.685768!16s%2Fg%2F11md9ng7b0!3m5!1s0x3174deb3ef536f31:0x8b7bb8b7c956157b!8m2!3d10.8221589!4d106.6868454!16s%2Fm%2F02pyzdj?entry=ttu&g_ep=EgoyMDI2MTEwMy4wIKXMDSoASAFQAw%3D%3D",
  },

  // 3. Lời nhắn gửi chân thành (Nội dung bức thư)
  letter: {
    title: "Gửi Em,",
    paragraphs: [
      "Vậy là chặng đường đại học của anh cũng đã đi đến ngày hái quả ngọt. Dù hiện tại hai đứa không còn đồng hành cùng nhau trên con đường tình cảm, nhưng anh vẫn luôn trân trọng những kỷ niệm và sự ủng hộ của em trong suốt quãng thời gian qua.",
      "Ngày lễ tốt nghiệp là một cột mốc ý nghĩa với anh, nên anh rất vui nếu em có thể sắp xếp thời gian ghé qua chia vui và chụp cùng anh một tấm hình kỷ niệm."
    ],
    signOff: "Mong em một đời an yên & hạnh phúc,",
    senderSign: "Minh Khánh"
  },

  // 4. Giai điệu hoài niệm (Nhạc nền)
  music: {
    title: "Kỷ Niệm Ngày Ấy (Acoustic Piano)",
    artist: "Giai Điệu Thanh Xuân",
    // File nhạc piano acoustic êm dịu đã được tạo sẵn ngay trong thư mục: music.wav
    // Bạn cũng có thể copy bài hát MP3 yêu thích của bạn vào thư mục và đổi thành "ten_bai_hat.mp3"
    audioSrc: "music.wav"
  },

  // 5. Ghi chú trang phục & quà tặng
  dresscode: "Trang phục thoải mái, lịch sự, chụp ảnh cùng anh thật xinh nhé",
  giftNote: "Em không cần mang hoa hay quà cầu kỳ đâu nhé. Sự có mặt và một nụ cười của em đã là món quà quý giá nhất rồi!"
};
