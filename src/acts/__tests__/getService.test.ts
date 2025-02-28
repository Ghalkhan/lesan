import {
  assertInstanceOf,
  assertThrows,
} from "https://deno.land/std/assert/mod.ts";
import { getService } from "../mod.ts";
import { mockActs } from "./getAct.test.ts";

Deno.test({
  name: "getService should return getUser from mockActs",
  fn() {
    const getOneService = getService(mockActs, "main");
    assertInstanceOf(getOneService, Object);
  },
});

Deno.test({
  name: "getService should throw error when we pass notServiceName",
  fn() {
    const getNotService = () => getService(mockActs, "notMain");
    assertThrows(getNotService, Error, "Invalid serviceName: notMain");
  },
});
