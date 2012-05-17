CUR_DIR=`dirname ${0}`
RAPTORJS_ROOT=${CUR_DIR}
JS_DIR=${RAPTORJS_ROOT}/src/main/resources/META-INF/resources/raptorjs_modules

pushd ${JS_DIR} > /dev/null
${RAPTORJS_ROOT}/node_modules/jshint/bin/hint .
popd > /dev/null