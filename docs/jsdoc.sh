#!/bin/sh

if [ $WORKSPACE ] 
then
    DOCS_DIR=$WORKSPACE/docs
    SRC_DIR=$WORKSPACE/src
    JSDOC_TOOLKIT_DIR=$WORKSPACE/tools/jsdoc-toolkit-2.4.0
    TEMPLATE_DIR=$WORKSPACE/docs/jsdoc-template
fi

if [ -z $WORKSPACE ] 
then
    DOCS_DIR=`dirname ${0}`
    SRC_DIR=${DOCS_DIR}/../src
    JSDOC_TOOLKIT_DIR=${DOCS_DIR}/../tools/jsdoc-toolkit-2.4.0
    TEMPLATE_DIR=${DOCS_DIR}//jsdoc-template
fi

echo Current directory: $PWD

echo Writing RaptorJS API docs to ${DOCS_DIR}/api
echo Source directory: ${SRC_DIR}

#java -jar "${JSDOC_TOOLKIT_DIR}/jsrun.jar" -opt -1 ${JSDOC_TOOLKIT_DIR}/app/run.js ${SRC_DIR}/main/resources/META-INF/resources/raptorjs_modules -t=${TEMPLATE_DIR} -r=30 -d=${DOCS_DIR}/api -p
java -jar "${JSDOC_TOOLKIT_DIR}/jsrun.jar" ${JSDOC_TOOLKIT_DIR}/app/run.js ${SRC_DIR}/main/resources/META-INF/resources/raptorjs_modules -t=${TEMPLATE_DIR} -r=30 -d=${DOCS_DIR}/api -p