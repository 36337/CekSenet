; ╔═══════════════════════════════════════════════════════════════╗
; ║           CekSenet - Inno Setup Installer Script              ║
; ╠═══════════════════════════════════════════════════════════════╣
; ║  Çek/Senet Takip Sistemi Windows Installer                    ║
; ║  Versiyon: 1.0.0                                              ║
; ╚═══════════════════════════════════════════════════════════════╝

#define MyAppName "CekSenet"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "Yalçınkaya"
#define MyAppURL "http://localhost:7474"
#define MyAppExeName "node.exe"
#define MyServiceName "CekSenet"

[Setup]
; Uygulama kimliği (GUID) - değiştirmeyin
AppId={{A1B2C3D4-E5F6-7890-ABCD-EF1234567890}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppVerName={#MyAppName} {#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
; Yönetici yetkisi gerekli (servis kurulumu için)
PrivilegesRequired=admin
; Output ayarları
OutputDir=output
OutputBaseFilename=CekSenet-Setup-{#MyAppVersion}
; Sıkıştırma
Compression=lzma2
SolidCompression=yes
; Modern görünüm
WizardStyle=modern
; Kurulum sihirbazı boyutu
WizardSizePercent=100
; Dil
; Uninstaller
UninstallDisplayIcon={app}\node\node.exe
UninstallDisplayName={#MyAppName}
; Versiyon bilgisi
VersionInfoVersion={#MyAppVersion}
VersionInfoCompany={#MyAppPublisher}
VersionInfoDescription=Çek/Senet Takip Sistemi
VersionInfoTextVersion={#MyAppVersion}
; Minimum Windows versiyonu (Windows 10)
MinVersion=10.0

[Languages]
Name: "turkish"; MessagesFile: "compiler:Languages\Turkish.isl"

[Messages]
turkish.BeveledLabel=Çek/Senet Takip Sistemi

[Tasks]
Name: "desktopicon"; Description: "Masaüstü kısayolu oluştur"; GroupDescription: "Ek görevler:"
Name: "autostart"; Description: "Windows başlangıcında otomatik başlat"; GroupDescription: "Ek görevler:"; Flags: checkedonce

[Files]
; Node.js runtime
Source: "build\node\*"; DestDir: "{app}\node"; Flags: ignoreversion recursesubdirs createallsubdirs

; Uygulama dosyaları
Source: "build\app\*"; DestDir: "{app}\app"; Flags: ignoreversion recursesubdirs createallsubdirs

; Servis scriptleri
Source: "build\service\*"; DestDir: "{app}\service"; Flags: ignoreversion recursesubdirs createallsubdirs

; Database ve logs klasörleri (boş)
Source: "build\database\*"; DestDir: "{app}\database"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "build\logs\*"; DestDir: "{app}\logs"; Flags: ignoreversion recursesubdirs createallsubdirs

[Dirs]
; Yazma izni gereken klasörler
Name: "{app}\database"; Permissions: users-modify
Name: "{app}\database\backups"; Permissions: users-modify
Name: "{app}\logs"; Permissions: users-modify

[Icons]
; Başlat menüsü
Name: "{group}\{#MyAppName}"; Filename: "http://localhost:7474"; IconFilename: "{app}\node\node.exe"
Name: "{group}\{#MyAppName} Durdur"; Filename: "{sys}\net.exe"; Parameters: "stop {#MyServiceName}"; IconFilename: "{sys}\shell32.dll"; IconIndex: 27
Name: "{group}\{#MyAppName} Başlat"; Filename: "{sys}\net.exe"; Parameters: "start {#MyServiceName}"; IconFilename: "{sys}\shell32.dll"; IconIndex: 137
Name: "{group}\Kaldır"; Filename: "{uninstallexe}"

; Masaüstü kısayolu
Name: "{autodesktop}\{#MyAppName}"; Filename: "http://localhost:7474"; IconFilename: "{app}\node\node.exe"; Tasks: desktopicon

[Run]
; Kurulum sonrası servis kurulumu
Filename: "{app}\node\node.exe"; Parameters: """{app}\service\install-service.js"""; WorkingDir: "{app}"; StatusMsg: "Servis kuruluyor..."; Flags: runhidden waituntilterminated
; Firewall kuralı ekle
Filename: "{sys}\netsh.exe"; Parameters: "advfirewall firewall add rule name=""CekSenet"" dir=in action=allow protocol=TCP localport=7474"; StatusMsg: "Firewall kuralı ekleniyor..."; Flags: runhidden waituntilterminated
; Tarayıcıda aç
Filename: "http://localhost:7474"; Description: "CekSenet'i tarayıcıda aç"; Flags: postinstall nowait shellexec skipifsilent

[UninstallRun]
; Servisi durdur ve kaldır
Filename: "{sys}\net.exe"; Parameters: "stop {#MyServiceName}"; Flags: runhidden waituntilterminated
Filename: "{app}\node\node.exe"; Parameters: """{app}\service\uninstall-service.js"""; WorkingDir: "{app}"; Flags: runhidden waituntilterminated
; Firewall kuralını kaldır
Filename: "{sys}\netsh.exe"; Parameters: "advfirewall firewall delete rule name=""CekSenet"""; Flags: runhidden waituntilterminated

[UninstallDelete]
; Oluşturulan dosyaları temizle (veritabanı ve loglar kullanıcıya bırakılabilir)
Type: filesandordirs; Name: "{app}\logs\*"

[Code]
// Kurulum öncesi kontroller
function InitializeSetup(): Boolean;
begin
  Result := True;
end;

// Kurulum sonrası
procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssPostInstall then
  begin
    // Kurulum tamamlandı
    Log('CekSenet kurulumu tamamlandı');
  end;
end;

// Kaldırma öncesi onay
function InitializeUninstall(): Boolean;
begin
  Result := MsgBox('CekSenet uygulamasını kaldırmak istediğinizden emin misiniz?' + #13#10 + #13#10 + 
                   'Not: Veritabanı dosyaları korunacaktır.', 
                   mbConfirmation, MB_YESNO) = IDYES;
end;
