cd ..
HostName=$(hostname -s)

nohup java -Xms1028m -Xmx2048m -cp  ".:./lib/*"  com.sgs.main.App "Loader" "Master" "delete" "Prerequisite" 1>>./logs/204_MQLExecutorMaster_${HostName}_Master_delete_out.log 2>>./logs/204_MQLExecutorMaster_${HostName}_Master_delete_error.txt & echo $! >./logs/204_MQLExecutorMaster_${HostName}_Master_delete.pid 