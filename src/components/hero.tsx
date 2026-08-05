import Image from "next/image";
import { profile, ui } from "@/data/profile";
import type { Locale } from "@/lib/i18n";

/* Tinggi header, dipakai untuk menghitung hero setinggi satu layar.
   69px, bukan 68: header itu 68px isi DITAMBAH `border-b` 1px, dan border ikut
   terhitung sebagai tinggi kotaknya. Selisih satu piksel itu sudah cukup untuk
   memunculkan scrollbar vertikal pada hero yang mestinya pas. */
const HEADER_H = "69px";

/* Panorama sawah sebagai pita di sepertiga atas hero.
   Dipasang sebagai `background-image` CSS, bukan <Image>, dengan sengaja:
   kalau berkasnya belum ada atau gagal dimuat, yang tersisa adalah gradien
   hero seperti semula — tidak ada kotak rusak dan tidak ada pergeseran tata
   letak. Konsekuensinya ia tidak lewat pengoptimal Next dan tidak di-preload;
   itu diterima karena LCP hero adalah judul teks, bukan gambar ini.
   Posisi vertikalnya `52%`, bukan `top`: gambarnya 3027×1284 sementara pitanya
   jauh lebih pipih, jadi `bg-cover` hanya menyisakan sekitar seperempat tinggi
   gambar. Mengunci ke `top` menyisakan langit dan puncak gunung — sawahnya,
   yang justru jadi alasan gambar ini dipilih, terbuang seluruhnya di bawah
   garis potong. 45% mendaratkan jendela itu pada punggungan gunung jauh,
   desa, sungai, dan terasering sekaligus — pita ini terlalu pipih untuk memuat
   puncak gunung DAN sawah, jadi angkanya adalah kompromi yang diukur, bukan
   selera: pada 1920×216 jendelanya jatuh di 33–60% tinggi gambar.
   Batas bawahnya TEGAS, tanpa mask gradien (2026-08-04, permintaan pemilik —
   sebelumnya dilarutkan). Mengaburkan batas terdengar lebih halus, tapi
   memaksa teks turun jauh ke bawah ekor yang memudar supaya kontrasnya aman,
   dan itulah yang membuat hero tidak muat satu layar. Batas tegas memulangkan
   ruang itu: di bawah garis warnanya kertas polos, jadi teks boleh berdiri
   tepat di bawahnya. Bingkai foto yang menumpangi garis tidak terpotong karena
   ia punya latar `bg-paper` sendiri — lengkungannya yang memotong pita, persis
   seperti di gambar referensi.
   Tingginya dibaca dari `--hero-band`, bukan ditulis ulang di sini: kolom teks
   menghitung turunnya dari angka yang sama, jadi keduanya tidak bisa lepas
   sinkron. Mengubah tinggi pita cukup di satu tempat. */
function FieldScene() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 h-[var(--hero-band)] bg-[url('/hero-sawah.webp')] bg-cover bg-[center_45%] bg-no-repeat opacity-95 dark:opacity-40 dark:saturate-50"
    />
  );
}

export function Hero({ locale }: { locale: Locale }) {
  return (
    <section
      id="hero"
      className="relative overflow-hidden lg:h-[var(--hero-h)]"
      style={
        {
          "--header-h": HEADER_H,
          background:
            "linear-gradient(180deg, var(--hero-from) 0%, var(--hero-mid) 48%, var(--hero-to) 100%)",
          // Hero dikunci setinggi satu layar (2026-08-04, permintaan pemilik),
          // dibagi 30% pita panorama dan 70% isi. Karena tingginya kini pasti,
          // setiap ukuran vertikal diturunkan DARI angka itu, bukan dari `svh`
          // sendiri-sendiri — inilah yang menjaga pembagian 30/70 tetap benar
          // di layar mana pun. Persen tidak bisa dipakai langsung pada padding
          // vertikal (persen padding mengacu ke LEBAR induk, bukan tinggi),
          // jadi pembagiannya lewat calc() atas `--hero-h`.
          "--hero-h": "calc(100svh - var(--header-h))",
          "--hero-band": "calc(var(--hero-h) * 0.3)",
          "--hero-top": "clamp(28px, 4.5svh, 52px)",
        } as React.CSSProperties
      }
    >
      <FieldScene />
      {/* Di lg wrapper mengisi tinggi hero dan jarak atasnya PERSIS setinggi
          pita, sehingga sisa ruangnya tepat 70% — pembagian yang diminta jadi
          konsekuensi tata letak, bukan angka yang ditulis dua kali lalu harus
          dijaga tetap cocok. */}
      <div className="relative mx-auto max-w-[1160px] px-6 pb-[clamp(40px,7svh,88px)] pt-[var(--hero-top)] max-lg:flex max-lg:min-h-[calc(100svh-var(--header-h))] max-lg:flex-col max-lg:justify-center max-lg:pb-[96px] max-lg:pt-3 short:pb-[88px] short:pt-2 lg:h-full lg:pb-0 lg:pt-[var(--hero-band)]">
        {/* Grid menempati seluruh 70% sisa dan isinya dipusatkan vertikal di
            dalamnya. Diukur dari gambar referensi, di sana teks juga duduk
            hampir tepat di tengah ruang bawah pita (55px sisa di atas, 69px di
            bawah) — bukan menempel ke garis. */}
        {/* Kolom kanan dilebarkan 0,88fr→0,97fr (2026-08-04): pada 1,12/0,88
            lebar kolomlah yang menghentikan foto (454px di 1920), bukan rumus
            tingginya, sehingga menaikkan plafon tinggi tidak berpengaruh apa
            pun. Kiri tetap ≥531px — di atas ~500px yang dibutuhkan `max-w-54ch`
            tagline, jadi jumlah barisnya tidak berubah dan blok teks tidak
            bertambah tinggi. */}
        <div className="grid items-center gap-[clamp(36px,6vw,80px)] max-lg:gap-4 short:gap-3 lg:h-full lg:grid-cols-[minmax(0,1.03fr)_minmax(0,0.97fr)]">
          {/* Tanpa offset apa pun: wrapper sudah mulai tepat di bawah garis
              pita, jadi kolom ini otomatis berada di area 70% dan dipusatkan
              di sana oleh `items-center`. Versi sebelumnya menghitung turunnya
              sendiri lewat margin — dua sumber kebenaran untuk satu posisi. */}
          <div>
            {/* Dinaikkan lagi (2026-08-04) untuk memakan ruang kosong di area
                70%: kicker 11,5→13,5px, nama 36–60→48–84px, peran 17–20→21–27px,
                tagline 15,5→18,5px. Jarak antarbaris ikut naik sepadan, kalau
                tidak tulisannya membesar tapi bloknya tetap sependek dulu dan
                ruang kosongnya tidak berkurang. */}
            <p className="mb-5 flex items-center gap-3.5 max-lg:mb-2.5 short:mb-2">
              <span className="font-mono text-[13.5px] uppercase tracking-[0.16em] text-accent-strong max-lg:text-[11px] short:text-[10px]">
                {profile.kicker[locale]}
              </span>
            </p>
            <h1 className="mb-5 font-serif text-[clamp(48px,6.2vw,84px)] font-semibold leading-[1.05] tracking-[-0.015em] text-ink [text-wrap:balance] max-lg:mb-3 max-lg:text-[clamp(32px,8.5vw,46px)] short:mb-2 short:text-[clamp(26px,7vw,36px)]">
              {profile.name}
            </h1>
            <p className="mb-4 font-serif text-[clamp(21px,2.3vw,27px)] font-medium italic leading-[1.4] text-green max-lg:mb-2.5 max-lg:text-[17px] short:mb-2 short:text-[15px] dark:text-sage">
              {profile.role[locale]}
            </p>
            <p className="mb-8 max-w-[54ch] text-[18.5px] leading-[1.6] text-muted [text-wrap:pretty] max-lg:mb-4 max-lg:text-[15px] short:mb-3 short:text-[13.5px]">
              {profile.tagline[locale]}
            </p>
            <div className="flex flex-wrap items-center gap-3.5">
              <a
                href="#publications"
                className="inline-flex items-center rounded-full bg-accent-strong px-7 py-3 text-[16.5px] font-semibold max-lg:px-6 max-lg:py-2.5 max-lg:text-[14.5px] text-on-accent no-underline transition-colors hover:bg-green hover:text-on-green short:px-5 short:py-2 short:text-[14px]"
              >
                {ui.hero.cta1[locale]}
              </a>
              <a
                href="#contact"
                className="inline-flex items-center rounded-full border border-green/40 px-7 py-3 text-[16.5px] font-semibold max-lg:px-6 max-lg:py-2.5 max-lg:text-[14.5px] text-green no-underline transition-colors hover:bg-sage/20 short:px-5 short:py-2 short:text-[14px] dark:border-sage/40 dark:text-sage"
              >
                {ui.hero.cta2[locale]}
              </a>
            </div>
          </div>
          {/* `self-start` + margin atas negatif, BUKAN margin negatif saja:
              pada item yang diratakan tengah, margin negatif hanya menggeser
              setengah nilainya (sisa ruang dibagi dua setelah kotak marginnya
              menyusut), jadi tarikan 0,4·pita ternyata hanya mengangkat foto
              0,2·pita dan puncaknya malah berhenti 22px DI BAWAH garis. Dengan
              `self-start` titik awalnya pasti — garis pita — dan tarikannya
              berlaku penuh. Karena negatif, ia tidak menambah tinggi grid,
              sehingga pembagian 30/70 tetap utuh: foto meluber ke wilayah pita
              tanpa mengambil ruangnya. */}
          <div className="relative min-w-0 max-lg:order-first lg:-mt-[calc(var(--hero-band)*0.38)] lg:self-start">
            {/* Paspartu: garis luar dan garis dalam adalah dua elemen nyata dengan
                jarak di antaranya, bukan outline + border — pada lengkungan
                setinggi ini jarak outline tidak bisa dikendalikan. Nilai lebar
                hidup di sini, bukan di <figure>, supaya lebar total foto+bingkai
                sama persis seperti sebelum bingkai ada dan kolom hero tidak
                bergeser. Radius luar = radius dalam + padding (190+14, 18+14)
                agar kedua lengkungan sekonsentris; varian `short` mengulang
                hitungan yang sama dengan padding 8px (190+8, 18+8) — di layar
                pendek bingkainya menyusut sampai ~127px dan paspartu setebal
                desktop di sana akan menelan fotonya.
                Padding dinaikkan 10→14px dan garis luar 1→2px (2026-08-04) atas
                permintaan pemilik: bingkainya harus terbaca sebagai kusen
                jendela, bukan garis pinggir.
                Di lg TINGGINYA yang dikunci (0,80·tinggi hero) dan lebarnya
                dibiarkan mengisi kolom — kebalikan dari sebelumnya, dan itu
                inti perbaikannya. Dulu lebarnya diturunkan dari tinggi lewat
                rasio tetap 3/5, sehingga begitu tinggi mentok plafon, lebarnya
                ikut terkunci di `tinggi·0,6` dan berhenti jauh sebelum tepi
                kolom: pada layar setinggi ~732px bingkainya hanya 330px di
                dalam kolom selebar 501px, menyisakan ~170px kosong yang tidak
                bisa dipakai apa pun. Rasio tetap hanya pas di satu tinggi
                layar; di layar lebar-pendek ia selalu menyempit.
                `max-w` 0,60·tinggi hero = 0,80·0,75, yakni batas rasio 3:4 —
                bingkainya boleh melebar mengisi kolom tapi tidak sampai jadi
                kotak, karena `object-cover` pada wadah mendekati persegi mulai
                memangkas kepala subjek.
                0,80 adalah plafon tingginya, bukan angka bebas: puncak bingkai
                duduk di `0,62·pita` = 0,186·tinggi hero, jadi apa pun di atas
                0,814 membuat tepi bawahnya keluar dari hero. Dicoba 0,82 lebih
                dulu dan tepi bawahnya memang lewat 3px pada 1280×600.
                `32px` yang muncul di beberapa hitungan adalah paspartu 14px dua
                sisi ditambah garis 2px dua sisi — figure mengisi sisa tinggi
                lewat `h-full`, jadi angkanya tidak perlu ditulis lagi di sini. */}
            <div className="relative mx-auto w-[min(560px,100%,calc((var(--hero-h)*0.8_-_32px)*0.6_+_32px))] rounded-[204px_204px_32px_32px] border-2 border-sand bg-paper p-[14px] shadow-frame max-lg:w-[min(52vw,24vh)] short:w-[min(42vw,19vh)] short:rounded-[198px_198px_26px_26px] short:p-2 lg:ml-auto lg:mr-0 lg:h-[calc(var(--hero-h)*0.8)] lg:w-full lg:max-w-[calc(var(--hero-h)*0.6)]">
              <figure className="relative my-0 aspect-[3/5] w-full overflow-hidden rounded-[190px_190px_18px_18px] border border-sand/70 lg:aspect-auto lg:h-full">
                <Image
                  src={profile.photo}
                  alt={ui.hero.photoAlt[locale]}
                  fill
                  priority
                  fetchPriority="high"
                  sizes="(max-width: 1024px) 86vw, 360px"
                  className="object-cover"
                />
              </figure>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
