@echo off
rem set JAVA_HOME=C:\Java\jdk1.8.0_341
set PATH=%JAVA_HOME%\bin;%PATH%
java -version
set APPDATA=%CD%\resources\data\appdata
java -jar lib/SGTAS-JIRA-XRAY-2.1.jar
pause