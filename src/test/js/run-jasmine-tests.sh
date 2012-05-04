RAPTORJS_ROOT="../../.."

if [ $1 ] 
then
	TESTS_PATH=jasmine/$1
else
	TESTS_PATH=jasmine
fi

${RAPTORJS_ROOT}/node_modules/jasmine-node/bin/jasmine-node --noColor --verbose $TESTS_PATH