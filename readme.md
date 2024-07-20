# WebApp Klasifikasi Abnormal/Normal Jantung Anak
## Deskripsi
WebApp ini merupakan aplikasi yang dapat digunakan untuk mengklasifikasikan data jantung anak menjadi abnormal atau normal. Data yang digunakan adalah data jantung anak yang diolah dan diproses menggunakan YOLOv8 untuk mengklasifikasikan data jantung anak menjadi abnormal atau normal. WebApp ini dibuat menggunakan Flask dan di-deploy secara lokal.

## Cara Penggunaan
1. Clone repository ini
2. Buka terminal dan arahkan ke folder repository ini
3. Install semua library yang dibutuhkan dengan menjalankan perintah berikut:
```
pip install -r requirements.txt
```
4. Salin model YOLOv8-cls ke folder ini
5. Jalankan perintah berikut untuk menjalankan WebApp:
```
python app.py
```
5. Buka browser pada path sesuai dengan yang tertera pada terminal
6. Upload gambar/video yang ingin diuji
7. Tunggu hingga proses selesai
8. Hasil klasifikasi akan ditampilkan pada halaman baru
9. Jika ingin menguji gambar/video lain, klik tombol "Home" dan ulangi langkah 6-8

## Note
- Model YOLOv8-cls merupakan model hasil training yang terbaik
- Folder `temp-media` digunakan untuk menyimpan gambar/video yang diupload, dan akan dihapus ketika menekan tombol "Home" pada halaman hasil

## Author
- [Rio Bastian](https://github.com/riobastian09)