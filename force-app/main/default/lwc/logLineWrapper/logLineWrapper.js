import { api, LightningElement, track, wire } from "lwc";
import {
  subscribe,
  APPLICATION_SCOPE,
  MessageContext
} from "lightning/messageService";
import LOG_ANALYSIS_STATE from "@salesforce/messageChannel/Log_Analysis_Viewer_State__c";
/*
  Ex Schema of logData:
  {"Id":88036,
  "type":"line",
  "logLineData":{"lineNumber":"[44]",
  "type":"VARAS",
  "varName":"execAnMatcher",
  "varValue":"{\"delegate\":\"0x79ce1bfb\"}"},
  "name":null,
  "unitId":null}

  {"Id":73448,
  "type":"unit",
  "logLineData":null,
  "name":"apexLogTryController",
  "unitId":61497}
 */
export default class LogLineWrapper extends LightningElement {
  @api logLinesData;
  logIdSubs = null;
  logId;
  @wire(MessageContext)
  messageContext;
  @track logsArr = [];

  get logsArrData() {
    return this.logsArr;
  }
  connectedCallback() {
    this.subscribeToMessageChannel();
  }
  subscribeToMessageChannel() {
    if (!this.logIdSubs) {
      this.logIdSubs = subscribe(
        this.messageContext,
        LOG_ANALYSIS_STATE,
        (message) => this.setLogId(message),
        { scope: APPLICATION_SCOPE }
      );
    }
  }
  setLogId(message) {
    console.log(
      "[logLineWrapper.js] logId fetched from messageChannel is ",
      this.logId
    );
    this.logId = message.logId;
    this.prepareLogData();
  }

  prepareLogData() {
    if (this.logId && this.logLinesData) {
      const parsedId = parseInt(this.logId, 10);
      if (this.logLinesData.has(parsedId)) {
        console.log("[logLineWrapper.js] LogDataForId is found");
        this.logsArr = this.logLinesData.get(parsedId);
      } else {
        console.log("[logLineWrapper.js] LogDataForId is null or undefined");
        this.logsArr = [];
      }
    }
    if (this.logsArr.length !== 0) {
      console.log(
        "[logLineWrapper.js] logsArr Data Changed with size:",
        this.logsArr.length
      );
      this.logsArr.forEach((log) => {
        if (log.type === "line") {
          let logTemp = log;
          logTemp.isLine = true;
          logTemp.isUnit = false;
          // <!-- VARAS -->
          if (logTemp.logLineData.type === "VARAS") {
            logTemp.eventClassComb = "slds-line-clamp varas";
            // logTemp.logLineData.type = "Variable Assigned:";
          }
          // <!-- VARIN -->
          else if (logTemp.logLineData.type === "VARIN") {
            logTemp.eventClassComb = "slds-line-clamp varin";
            // logTemp.logLineData.type = "Variable Initialized:";
          }

          // <!-- DEBUG -->
          else if (logTemp.logLineData.type === "DEBUG") {
            logTemp.eventClassComb = "slds-line-clamp debug";
            // logTemp.logLineData.type = "DEBUG Statement:";
          }

          log = logTemp;
        } else if (log.type === "unit") {
          log.isLine = false;
          log.isUnit = true;
        }
      });
    }
  }
}
