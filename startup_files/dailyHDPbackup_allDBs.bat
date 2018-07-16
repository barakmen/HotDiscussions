@echo off
for /f "delims=" %%a in ('wmic OS Get localdatetime  ^| find "."') do set dt=%%a

set YYYY=%dt:~0,4%
set MM=%dt:~4,2%
set DD=%dt:~6,2%
set HH=%dt:~8,2%
set Min=%dt:~10,2%
set Sec=%dt:~12,2%

set stamp=%YYYY%_%MM%_%DD%_%HH%_%Min%
REM xcopy "C:\Users\srominm\Documents" "C:\Backup\backupHistory\%stamp%" /c /e /i /y /s > %stamp%.log\

set DEST="C:\Backup\backupHistory\%stamp%"
mkdir %DEST%
mongodump -h 127.0.0.1:28017 -o %DEST%