@echo off
cd ..

java -Xms1028m -Xmx2048m -cp  ".:./lib/*"  com.sgs.main.App "Loader" "Master" "delete" "Prerequisite" 
rem 1>>./logs/02_MQLExecutorMaster_${HostName}_Master_delete_out.log 2>>./logs/02_MQLExecutorMaster_${HostName}_Master_delete_error.txt & echo $! >./logs/02_MQLExecutorMaster_${HostName}_Master_delete.pid 
pause


@echo off