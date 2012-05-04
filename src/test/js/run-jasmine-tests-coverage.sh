RAPTORJS_ROOT=`cd ../../..; pwd`
TESTS_DIR=${RAPTORJS_ROOT}/src/test/js/jasmine
JS_DIR=${RAPTORJS_ROOT}/src/main/resources/META-INF/resources/js
JS_COV_DIR=${RAPTORJS_ROOT}/target/raptor-cov
JSCOVERAGE_REPORT_DIR=${RAPTORJS_ROOT}/target/raptor-cov-report
TOOLS_DIR=${RAPTORJS_ROOT}/tools


rm -rf ${JS_COV_DIR}

echo RaptorJS Root: ${RAPTORJS_ROOT}
echo Tests Dir: ${TESTS_DIR}
echo JS Dir: ${JS_DIR}
echo Coverage Dir: ${JS_COV_DIR}
echo

mkdir -p ${JS_COV_DIR}/raptor

${RAPTORJS_ROOT}/tools/node-jscoverage/bin/unix/node-jscoverage ${JS_DIR}/raptor ${JS_COV_DIR}/raptor

pushd ${TESTS_DIR} > /dev/null
env RAPTORJS_DIR=${JS_COV_DIR} JSCOVERAGE_REPORT_DIR=${JSCOVERAGE_REPORT_DIR} RAPTORJS_TOOLS_DIR=${TOOLS_DIR} ${RAPTORJS_ROOT}/node_modules/jasmine-node/bin/jasmine-node --noColor --verbose .
popd > /dev/null