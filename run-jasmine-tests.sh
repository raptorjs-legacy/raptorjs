RAPTORJS_ROOT="."
JASMINE_DIR="src/test/javascript/jasmine"

if [ $1 ] 
then
	TESTS_PATH=${JASMINE_DIR}/$1
else
	TESTS_PATH=${JASMINE_DIR}
fi

${RAPTORJS_ROOT}/src/test/javascript/jasmine/node_modules/jasmine-node/bin/jasmine-node --noColor --verbose $TESTS_PATH

