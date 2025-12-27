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

[Setup]
; Uygulama kimliği (GUID) - değiştirmeyin
AppId={{A1B2C3D4-E5F6-7890-ABCD-EF1234567890}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppVerName={#MyAppName} {#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
; Yönetici yetkisi gerekli (firewall için)
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
; 64-bit kurulum
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible

[Languages]
Name: "turkish"; MessagesFile: "compiler:Languages\Turkish.isl"

[Messages]
turkish.BeveledLabel=Çek/Senet Takip Sistemi

[Tasks]
Name: "desktopicon"; Description: "Masaüstü kısayolu oluştur"; GroupDescription: "Ek görevler:"
Name: "autostart"; Description: "Windows başlangıcında otomatik başlat"; GroupDescription: "Ek görevler:"

[Files]
; Node.js runtime
Source: "build\node\*"; DestDir: "{app}\node"; Flags: ignoreversion recursesubdirs createallsubdirs

; Uygulama dosyaları (backend + frontend)
Source: "build\app\*"; DestDir: "{app}\app"; Flags: ignoreversion recursesubdirs createallsubdirs

; Servis/başlatıcı scriptleri
Source: "build\service\*"; DestDir: "{app}\service"; Flags: ignoreversion recursesubdirs createallsubdirs

[Dirs]
; Yazma izni gereken klasörler (backend içinde)
Name: "{app}\app\backend\database"; Permissions: users-modify
Name: "{app}\app\backend\database\backups"; Permissions: users-modify
Name: "{app}\app\backend\logs"; Permissions: users-modify

[Icons]
; Başlat menüsü - Web arayüzü
Name: "{group}\{#MyAppName}"; Filename: "http://localhost:7474"; IconFilename: "{app}\node\node.exe"

; Başlat menüsü - Sunucuyu Başlat
Name: "{group}\{#MyAppName} Sunucuyu Başlat"; Filename: "{app}\node\node.exe"; Parameters: """{app}\service\start-background.js"""; WorkingDir: "{app}"; IconFilename: "{app}\node\node.exe"

; Başlat menüsü - Kaldır
Name: "{group}\Kaldır"; Filename: "{uninstallexe}"

; Masaüstü kısayolu - Web arayüzü
Name: "{autodesktop}\{#MyAppName}"; Filename: "http://localhost:7474"; IconFilename: "{app}\node\node.exe"; Tasks: desktopicon

; Windows Startup - Otomatik başlatma
Name: "{userstartup}\{#MyAppName}"; Filename: "{app}\node\node.exe"; Parameters: """{app}\service\start-background.js"""; WorkingDir: "{app}"; Tasks: autostart

[Run]
; Firewall kuralı ekle
Filename: "{sys}\netsh.exe"; Parameters: "advfirewall firewall add rule name=""CekSenet"" dir=in action=allow protocol=TCP localport=7474"; StatusMsg: "Firewall kuralı ekleniyor..."; Flags: runhidden waituntilterminated

; Uygulamayı arka planda başlat
Filename: "{app}\node\node.exe"; Parameters: """{app}\service\start-background.js"""; WorkingDir: "{app}"; StatusMsg: "Sunucu başlatılıyor..."; Flags: runhidden waituntilterminated

; Tarayıcıda aç
Filename: "http://localhost:7474"; Description: "CekSenet'i tarayıcıda aç"; Flags: postinstall nowait shellexec skipifsilent

[UninstallRun]
; Firewall kuralını kaldır
Filename: "{sys}\netsh.exe"; Parameters: "advfirewall firewall delete rule name=""CekSenet"""; Flags: runhidden waituntilterminated

[UninstallDelete]
; Oluşturulan dosyaları temizle
Type: filesandordirs; Name: "{app}\app\backend\logs\*"
; Startup kısayolunu sil
Type: files; Name: "{userstartup}\{#MyAppName}.lnk"

[Code]
// Kaldırma öncesi - çalışan node.exe process'lerini kapat
procedure CurUninstallStepChanged(CurUninstallStep: TUninstallStep);
var
  ResultCode: Integer;
begin
  if CurUninstallStep = usUninstall then
  begin
    // CekSenet node process'ini kapat (port 7474 dinleyen)
    Exec('cmd.exe', '/c for /f "tokens=5" %a in (''netstat -ano ^| findstr :7474'') do taskkill /f /pid %a', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  end;
end;

// Kaldırma öncesi onay
function InitializeUninstall(): Boolean;
begin
  Result := MsgBox('CekSenet uygulamasını kaldırmak istediğinizden emin misiniz?' + #13#10 + #13#10 + 
                   'Not: Veritabanı dosyaları korunacaktır.', 
                   mbConfirmation, MB_YESNO) = IDYES;
end;
