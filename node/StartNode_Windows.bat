@echo off
for %%B in (%~dp0\.) do set PARENTDIR=%%~dpB
set DRIVER_CHROME="%PARENTDIR%drivers\chromedriver-81.0.4044.69.exe"
set DRIVER_IE="%PARENTDIR%drivers\IEDriverServer_Win32_3.150.1.exe"
set DRIVER_FIREFOX="%PARENTDIR%drivers\geckodriver-v0.26.0-win32.exe"
set SELENIUM_SERVER_JAR="%PARENTDIR%dependencies\selenium-server-standalone-3.141.59.jar"
set HUB_REGISTER_URL="http://192.168.233.1:4444/grid/register"
set NODE_PORT="5577"

java  -Dwebdriver.chrome.driver="%DRIVER_CHROME%" -Dwebdriver.ie.driver="%DRIVER_IE%" -Dwebdriver.gecko.driver="%DRIVER_FIREFOX%" -jar %SELENIUM_SERVER_JAR% -role node -hub %HUB_REGISTER_URL% -port %NODE_PORT%