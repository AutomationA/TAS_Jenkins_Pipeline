cd ..

#Execute Following command in MQL manually to add the ATE_Cleanup.tcl
#add prog ATE_Cleanup.tcl file jpo/ATE_Cleanup.tcl;

nohup /mnt/sdb/epic/ftest1a/3dspace-tp/code/server/scripts/mql -c "set cont user creator;exec prog ATE_Cleanup.tcl '$1';" >> ./logs/04_CleanupData$1.log 2>&1&