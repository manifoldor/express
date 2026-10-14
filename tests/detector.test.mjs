import { test } from "node:test";
import assert from "node:assert/strict";
import { CarrierDetector } from "../dist/core/detector.js";

test("CarrierDetector - auto detects SF tracking numbers", () => {
  const detector = new CarrierDetector();
  const matches = detector.detect("SF1428571428571");
  assert.ok(matches.length > 0);
  assert.equal(matches[0].carrier.code, "sf");
  assert.equal(matches[0].confidence, "high");
});

test("CarrierDetector - auto detects JD tracking numbers", () => {
  const detector = new CarrierDetector();
  const matches = detector.detect("JD00123456789");
  assert.ok(matches.length > 0);
  assert.equal(matches[0].carrier.code, "jd");
  assert.equal(matches[0].confidence, "high");
});

test("CarrierDetector - auto detects EMS tracking numbers", () => {
  const detector = new CarrierDetector();
  const matches = detector.detect("EA123456789CN");
  assert.ok(matches.length > 0);
  assert.equal(matches[0].carrier.code, "ems");
  assert.equal(matches[0].confidence, "high");
});

test("CarrierDetector - auto detects YTO tracking numbers", () => {
  const detector = new CarrierDetector();
  const matches = detector.detect("YT9283748291029");
  assert.ok(matches.length > 0);
  assert.equal(matches[0].carrier.code, "yto");
  assert.equal(matches[0].confidence, "high");
});

test("CarrierDetector - auto detects JT tracking numbers", () => {
  const detector = new CarrierDetector();
  const matches = detector.detect("JT5123456789123");
  assert.ok(matches.length > 0);
  assert.equal(matches[0].carrier.code, "jt");
  assert.equal(matches[0].confidence, "high");
});

test("CarrierDetector - auto detects ZTO by typical digits", () => {
  const detector = new CarrierDetector();
  const matches = detector.detect("751234567890");
  assert.ok(matches.length > 0);
  assert.equal(matches[0].carrier.code, "zto");
});

test("CarrierDetector - extracts courier contact information", () => {
  const text = "【北京市】快件已到达中关村营业部，派件员：张师傅 (电话：13812345678) 正在派件中";
  const contact = CarrierDetector.extractCourier(text);
  assert.equal(contact.name, "张师傅");
  assert.equal(contact.phone, "13812345678");
});

test("CarrierDetector - normalizes logistics status correctly", () => {
  assert.equal(
    CarrierDetector.normalizeStatus("快件已被 丰巢快递柜代收，凭码取件"),
    "OUT_FOR_DELIVERY"
  );
  assert.equal(
    CarrierDetector.normalizeStatus("客户已签收，签收人：本人"),
    "DELIVERED"
  );
  assert.equal(
    CarrierDetector.normalizeStatus("派件员正在派送中，请保持电话通畅"),
    "OUT_FOR_DELIVERY"
  );
  assert.equal(
    CarrierDetector.normalizeStatus("快件到达北京转运中心，集装箱干线运输中"),
    "IN_TRANSIT"
  );
  assert.equal(
    CarrierDetector.normalizeStatus("快件已由营业网点收件揽收"),
    "PICKED_UP"
  );
  assert.equal(
    CarrierDetector.normalizeStatus("因客户电话关机，派送异常，明日重派"),
    "EXCEPTION"
  );
});
