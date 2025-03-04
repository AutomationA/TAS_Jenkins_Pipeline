@echo off

cd ..

java -Xms1028m -Xmx2048m -cp  "lib/*"  com.sgs.main.App "Loader" "Master" "execute" "Prerequisite" 

rem 1>>./logs/02_MQLExecutorMaster_out.log 2>>./logs/02_MQLExecutorMaster_error.txt

pause