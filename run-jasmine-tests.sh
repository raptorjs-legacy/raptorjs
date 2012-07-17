RAPTORJS_ROOT="."
JASMINE_DIR=test
if [ $1 ] 
then
	TESTS_PATH=${JASMINE_DIR}/$1
else
	TESTS_PATH=${JASMINE_DIR}
fi

${RAPTORJS_ROOT}/node_modules/.bin/jasmine-node --noColor --verbose $TESTS_PATH

