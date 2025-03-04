@echo off
cd ..
set LOADER_LIB_PATH="%CD%/lib"
set 3DEXP_LIB_PATH="D:/Apps/19x/tomact/webapps/3DSpace/WEB-INF/lib"
set 3DEXP_CLASSES_PATH="D:/Apps/19x/tomact/webapps/3DSpace/WEB-INF/classes"

java  -cp "%LOADER_LIB_PATH%/*;%3DEXP_LIB_PATH%/*;%3DEXP_CLASSES_PATH%/*" com.sgs.main.App "Loader" "%1" "%2" "%3"

 pause