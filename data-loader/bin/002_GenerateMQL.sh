cd ..

HostName=$(hostname -s)

nohup java -Xms1028m -Xmx2048m -cp ".:./lib/**" com.sgs.main.App "FSToMQL" 1>>./logs/002_GenerateMQL_${HostName}_$1_$2_out.log 2>>./logs/002_GenerateMQL_${HostName}_$1_$2_error.txt & echo $! >./logs/002_GenerateMQL_${HostName}_$1_$2.pid