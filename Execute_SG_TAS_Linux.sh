# Export APPDATA using Linux syntax
export APPDATA="$(pwd)/resources/data/appdata"

# Run the Java JAR file
java -jar lib/SGTAS-JIRA-XRAY-2.1.jar
read -p "Press Enter to continue..."