cd ..

. /mnt/sdb/epic/ftest1a/3dspace-tp/code/server/scripts/mxEnv.sh

MX_MEMORY_SYSTEM_LIMIT=1636m
export MX_MEMORY_SYSTEM_LIMIT

HostName=$(hostname -s)

nohup java -Xms1028m -Xmx2048m -cp ".:./lib/*:/mnt/sdb/epic/ftest1a/3dspace-tp/instances/1/webapps/3dspace/WEB-INF/lib/*:/mnt/sdb/epic/ftest1a/3dspace-tp/instances/1/webapps/3dspace/WEB-INF/classes:/mnt/sdb/epic/ftest1a/3dspace-tp/softs/was/lib/*" com.sgs.main.App "Loader" "$1" "$2" "$3" 1>>./logs/00_MQLExecutor_${HostName}_$1_$2_out.log 2>>./logs/00_MQLExecutor_${HostName}_$1_$2_error.txt & echo $! >./logs/00_MQLExecutor_${HostName}_$1_$2.pid
