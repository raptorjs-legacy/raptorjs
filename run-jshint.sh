TEST_JS_DIR=`dirname ${0}`
RAPTORJS_ROOT=${TEST_JS_DIR}/../../..
JS_DIR=${RAPTORJS_ROOT}/src/main/resources/META-INF/resources/js/raptor

pushd ${JS_DIR} > /dev/null
${RAPTORJS_ROOT}/node_modules/jshint/bin/hint .
popd > /dev/null