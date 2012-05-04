RAPTORJS_ROOT=`pwd`
TESTS_DIR=${RAPTORJS_ROOT}/src/test/javascript/jasmine
JS_DIR=${RAPTORJS_ROOT}/src/main/resources/META-INF/resources/raptorjs_modules
JS_COV_DIR=${RAPTORJS_ROOT}/target/raptor-cov/raptorjs_modules
JSCOVERAGE_REPORT_DIR=${RAPTORJS_ROOT}/target/raptor-cov-report
TOOLS_DIR=${RAPTORJS_ROOT}/tools


rm -rf ${JS_COV_DIR}

echo RaptorJS Root: ${RAPTORJS_ROOT}
echo Tests Dir: ${TESTS_DIR}
echo JS Dir: ${JS_DIR}
echo Coverage Dir: ${JS_COV_DIR}
echo

mkdir -p ${JS_COV_DIR}

${RAPTORJS_ROOT}/tools/node-jscoverage/bin/unix/node-jscoverage ${JS_DIR} ${JS_COV_DIR}

pushd ${TESTS_DIR} > /dev/null
env RAPTORJS_DIR=${JS_COV_DIR} JSCOVERAGE_REPORT_DIR=${JSCOVERAGE_REPORT_DIR} RAPTORJS_TOOLS_DIR=${TOOLS_DIR} ${RAPTORJS_ROOT}/src/test/javascript/jasmine/node_modules/jasmine-node/bin/jasmine-node --noColor --verbose .
popd > /dev/null