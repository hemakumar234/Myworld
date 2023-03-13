// This file is common template for multiple brands and locales

var {
	click,
	openBrowser,
	goto,
	resizeWindow,
	textBox,
	scrollUp,
	scrollDown,
	isVisible,
	listItem,
	tap,
	scrollTo,
	focus,
	switchTo,
	alert,
	accept,
	hover,
	title,
	closeTab,
	equal,
	scrollIntoView,
	search,
	includes,
	reload,
	split,
	clear,
	contains,
	goBack,
	waitFor,
	write,
	into,
	checkBox,
	below,
	dropDown,
	toRightOf,
	link,
	button,
	$,
	emulateDevice,
	evaluate,
	setConfig,
	press,
	text,
	currentURL,
	radioButton,
	deleteCookies,
	setCookie,
	replace,
} = require("taiko");
assert = require("assert");
let creds = require("../appsettings.js");
/*let Hengine = require('../../transpiler/hengine');
let taikoOverride = require('../../helix_taiko');
*/

/******** CODE TO RECEIVE AND FORM THE BASE URL AND ADMIN URL ******/
// PROD, PREPROD, STAGE, DEV, FEAT, ENG, PINCER, PREVIEW
var envir = process.env.ENVIRONMENT || "PROD";
var allCookies = process.env.COOKIES || ""; //The format should be like cookie1:value1,cookie2:value2
var revTag = process.env.REVISIONTAG || "";
var FeatStr = process.env.JIRAID || ""; //Applicable for EphemeralEnv, Feature, Personal ENG, Branch Server Env
var perlGemEnv = process.env.PERLGEMENV || "preprod"; //preprod, stage, qa, Applicable for EphemeralEnv and Feature Env
var akamaiBypass = process.env.AKAMAIBYPASS || "false";
var varnishBypass = process.env.VARNISHBYPASS || "false";
var apiEnv = process.env.APIENV || ""; //Applicable only on Lower Environment
var ncsaSerNum = process.env.NCSASERVERNUM || ""; //Applicable for Personal ENG and Branch Server Env

var isDiscovery = process.env.ISDISCOVERY === "true" ? true : false; // Self-healing discovery
var doHeal = process.env.DOHEAL === "true" ? true : false; // Self-healing
let sourceTaikoDollar = $; // Cloning actual taiko $
let sourceTaikoEvaluate = evaluate; // Cloning actual taiko evaluate
var feature = "MPPSPP";
var CommonData = {};

var brandLocale = "";
var [featureUser, featurePwd] = [];
var produrl = "";
var produrladm = "";
var stageurlActual = "";
var stageurl = "";
var stageurladm = "";
var devurl = "";
var devurladm = "";
var preprodurl = "";
var preprodurladm = "";
var pincerurl = "";

function reinitialize() {
	// Nothing to re-initialize. All the variables are initialized with empty values
}

async function initAutoHeal() {
	$ = taikoOverride.taikoDollar(sourceTaikoDollar, sourceTaikoEvaluate, brandLocale, isDiscovery, feature);

	evaluate = await taikoOverride.taikoEvaluate(sourceTaikoEvaluate, sourceTaikoDollar, doHeal, brandLocale, feature);
}

function initTestEnvironment(siteDefinition) {
	brandLocale = siteDefinition.brandLocale;

	let allCreds = creds.credentailsManager;
	let brandCode = brandLocale.split("-")[0];
	[featureUser, featurePwd] = getCredentials(allCreds, "FEATURE");
	let [brUserID, brPasswd] = getCredentials(allCreds, brandCode);
	let [brAdmID, brAdmPasswd] = getCredentials(allCreds, "ADMIN");
	var [pincerUser, pincerPasswd] = getCredentials(allCreds, "PINCER");

	let urlBrandPrefix = "https://" + brUserID + ":" + brPasswd + "@";
	let urlAdmPrefix = "https://" + brAdmID + ":" + brAdmPasswd + "@";
	let pincerPrefix = "https://" + pincerUser + ":" + pincerPasswd + "@";

	produrl = siteDefinition.prodUrl;
	produrladm = produrl.replace("https://", urlAdmPrefix);

	stageurlActual = siteDefinition.stageUrl;
	stageurl = stageurlActual.replace("https://", urlBrandPrefix);
	stageurladm = stageurlActual.replace("https://", urlAdmPrefix);

	devurl = stageurl.replace("stage", "dev"); // Why can't we use siteDefinition.devUrl
	devurladm = stageurladm.replace("stage", "dev");

	preprodurl = produrl.replace("www.", "wwwtmp."); // Why can't we use siteDefinition.preProdUrl
	preprodurladm = produrladm.replace("www.", "wwwtmp.");

	pincerurl = produrl.replace("https://", pincerPrefix);
	produrladm = produrl.replace("https://", urlAdmPrefix);
}

async function initFrameworkSettings() {
	let [brand, locale, restOfTags] = process.env.tags.split(",");

	let {locatorDefinitions, dataDefinitions, siteDefinition} = await Hengine.generator(`${brand}-${locale}`, feature); // This should come from Gauge Tags inputs

	if (siteDefinition.brandLocale === undefined) {
		assert(false, `There are no site details for ${brand}-${locale} in the database`);
	}

	if (locatorDefinitions.length === 0) {
		assert(false, `There are no locator details for ${brand}-${locale} in the database`);
	}

	if (dataDefinitions.length === 0) {
		assert(false, `There are no data definitions for ${brand}-${locale} in the database`);

		if (isDiscovery) {
			console.log("System is running in discovery phase");
		}

		if (doHeal) {
			console.log("System is running with healing enabled");
		}
	}

	// Setup locators
	for (let i = 0; i < locatorDefinitions.length; i++) {
		this[locatorDefinitions[i].locatorKey] = locatorDefinitions[i].locatorValue;
	}

	// console.table(dataDefinitions);

	// Setup common data
	for (let i = 0; i < dataDefinitions.length; i++) {
		CommonData[dataDefinitions[i].dataKey] = dataDefinitions[i].dataValue;
	}

	// Setup testing Urls
	initTestEnvironment(siteDefinition);

	// Setup self healing
	initAutoHeal();

	// Re-initialize variables
	reinitialize();
}

// To convert a given url to mobile url, if the platform is mobile

function convertToMobileUrl(hostName, testPlatform) {
	// No conversion needed if the platform is PC
	if (testPlatform.localeCompare("PC") != -1) return hostName;
	// No conversion needed if the url is that of Jomalone
	if (hostName.search("jomalone") != -1) return hostName;
	// No conversion needed if the url is that of DrJart
	if (hostName.search("drjart") != -1) return hostName;
	if (hostName.search("pincer") != -1) return hostName;
	// For PreProd, the following change is done
	// If wwwtmp. exists in the url, it is changed to mtmp.
	if (hostName.search("wwwtmp.") != -1) {
		hostName = hostName.replace("wwwtmp.", "mtmp.");
		return hostName;
	}
	// For Prod, the following change is done
	// If www. exists in the url, it is changed to m.
	if (hostName.search("www.") != -1) {
		hostName = hostName.replace("www.", "m.");
		return hostName;
	}
	// For Stage, the following change is done
	// If @e. exists in the url, it is changed to @m.e.
	if (hostName.search("@e.") != -1) {
		hostName = hostName.replace("@e.", "@m.e.");
		return hostName;
	}
	console.log("Unknown url type");
	return hostName;
}

function getAdmURL(platform) {
	switch (envir.toUpperCase()) {
		case "DEV":
			if (platform.toUpperCase() == "PC") {
				baseURLAdm = devurl;
			} else {
				baseURLAdm = convertToMobileUrl(devurl, platform);
			}
			break;
		case "STAGE":
			if (platform.toUpperCase() == "PC") {
				baseURLAdm = stageurl;
			} else {
				baseURLAdm = convertToMobileUrl(stageurl, platform);
			}
			break;
		case "PREPROD":
			if (platform.toUpperCase() == "PC") {
				baseURLAdm = preprodurladm;
			} else {
				baseURLAdm = convertToMobileUrl(preprodurladm, platform);
			}
			break;
		case "PROD":
			if (platform.toUpperCase() == "PC") {
				baseURLAdm = produrladm;
			} else {
				baseURLAdm = convertToMobileUrl(produrladm, platform);
			}
			break;

		case "FEAT":
			if (platform.toUpperCase() == "PC") {
				baseURLAdm = convertToFeatUrl(stageurladm);
			} else {
				baseURLAdm = convertToMobileUrl(convertToFeatUrl(stageurladm), platform);
			}
			break;
		case "ENG":
			if (platform.toUpperCase() == "PC") {
				baseURLAdm = convertToPersEngUrl(stageurl);
			} else {
				baseURLAdm = convertToMobileUrl(convertToPersEngUrl(stageurl), platform);
			}
			break;
		case "PREVIEW":
			if (platform.toUpperCase() == "PC") {
				baseURLAdm = convertToPreviewURL(stageurladm);
			} else {
				baseURLAdm = convertToMobileUrl(convertToPreviewURL(stageurladm), platform);
			}
			break;
		case "PINCER":
			if (platform.toUpperCase() == "PC") {
				baseURLAdm = produrladm;
			} else {
				baseURLAdm = convertToMobileUrl(produrladm, platform);
			}
			break;
		default:
			if (platform.toUpperCase() == "PC") {
				baseURLAdm = produrladm;
			} else {
				baseURLAdm = convertToMobileUrl(produrladm, platform);
			}
			break;
	}
	return baseURLAdm;
}

function getBaseURL(platform) {
	switch (envir.toUpperCase()) {
		case "DEV":
			if (platform.toUpperCase() == "PC") {
				baseURL = devurl;
			} else {
				baseURL = convertToMobileUrl(devurl, platform);
			}
			break;
		case "STAGE":
			if (platform.toUpperCase() == "PC") {
				baseURL = stageurl;
			} else {
				baseURL = convertToMobileUrl(stageurl, platform);
			}
			break;
		case "PREPROD":
			if (platform.toUpperCase() == "PC") {
				baseURL = preprodurl;
			} else {
				baseURL = convertToMobileUrl(preprodurl, platform);
			}
			break;
		case "PROD":
			if (platform.toUpperCase() == "PC") {
				baseURL = produrl;
			} else {
				baseURL = convertToMobileUrl(produrl, platform);
			}
			break;
		case "FEAT":
			if (platform.toUpperCase() == "PC") {
				baseURL = convertToFeatUrl(stageurl);
			} else {
				baseURL = convertToMobileUrl(convertToFeatUrl(stageurl), platform);
			}
			break;
		case "ENG":
			if (platform.toUpperCase() == "PC") {
				baseURL = convertToPersEngUrl(stageurl);
			} else {
				baseURL = convertToMobileUrl(convertToPersEngUrl(stageurl), platform);
			}
			break;
		case "PREVIEW":
			if (platform.toUpperCase() == "PC") {
				baseURL = convertToPreviewURL(stageurladm);
			} else {
				baseURL = convertToMobileUrl(convertToPreviewURL(stageurladm), platform);
			}
			break;
		case "PINCER":
			if (platform.toUpperCase() != "") {
				baseURL = pincerurl.replace("www.", "pincer.");
			}
			break;
		default:
			if (platform.toUpperCase() == "PC") {
				baseURL = produrl;
			} else {
				baseURL = convertToMobileUrl(produrl, platform);
			}
			break;
	}
	return baseURL;
}

function convertToFeatUrl(url) {
	var tempUrl = "";
	var FeatureURL = "";
	tempUrl = url.split(".", 4).join(".") + "." + FeatStr + url.substring(url.split(".", 5).join(".").length, url.split(".", 6).join(".").length) + perlGemEnv + ".usva1.feature.elco.cloud/";
	if (url.includes("elc:")) {
		FeatureURL = tempUrl;
	} else {
		tempUrl = tempUrl.replace(tempUrl.substring(tempUrl.split("/", 2).join("/").length + 1, tempUrl.split(":", 2).join(":").length), featureUser);
		FeatureURL = tempUrl.replace(tempUrl.substring(tempUrl.split(":", 2).join(":").length + 1, tempUrl.split("@", 1).join("@").length), featurePwd);
	}
	return FeatureURL;
}

function convertToPersEngUrl(url) {
	var branchURL = "";
	branchURL = url.split(".", 4).join(".") + "." + FeatStr + url.substring(url.split(".", 5).join(".").length, url.split(".", 5).join(".").length) + ".eng.ncsa" + ncsaSerNum + ".elcdev.net";
	return branchURL;
}

function convertToPreviewURL(url) {
	let previewURL = "";
	previewURL = url.split(".", 4).join(".") + "." + FeatStr + ".preview.elco.cloud";
	return previewURL;
}

async function setRevTag(platform) {
	if (revTag.localeCompare("") != 0 && !(envir.toUpperCase() == "PROD" || envir.toUpperCase() == "PREPROD")) {
		await setCookie("ELC_SITE_TAG", revTag, {url: getBaseURL(platform)});
		gauge.message("Revision Tag is set as " + revTag);
	} else {
		gauge.message("No revision tag is set");
	}
}

//For Preview Environment
async function getPerlgemEnvCookie(plat) {
	if (envir.toUpperCase() == "PREVIEW") {
		var pgCookie = "";
		pgCookie = stageurl.substring(stageurl.split(".", 5).join(".").length + 1, stageurl.split(".", 6).join(".").length) + perlGemEnv;
		await setCookie("target_env", pgCookie, {url: getBaseURL(plat)});
		gauge.message("PerlGem Environment Cookie target_env is set as " + pgCookie);
		//return pgCookie;
	}
}

//This function getCredentials() is to get and return the credentials from the appsettings.js file
function getCredentials(credentialsMap, brand) {
	let brandCredential = [];
	credentialsMap.forEach(item => {
		let hasFound = item.includes(brand);
		if (hasFound) {
			let [, , username, password] = item;
			brandCredential = [username, encodeURIComponent(password)];
		}
	});
	return brandCredential;
}

/******** BASE URL and ADM URL IS RECEIVED ******/

/*Front end Generic functions */

var SPPpageprodHeader = "";
var SPPpageprodHeaderMob = "";
var ProductViewClass = "";
var MobProductViewClass = "";
var ClickCartpageLink = "";
var ClickCartpageLinkMob = "";
var ScrollDownvalue = "";
var QuickViewClass = "";
var QuickViewClassMob = "";
var AddToBagMPP = "";
var AddToBagSPP = "";
var Productname = "";
var CartpageURLText = "";
var ProductViewtext = "";
var MobProductViewtext = "";
var CartProductnameLoc = "";
var CartProductnameLocMob = "";
var MPPpagegrid = "";
var GnavProductsubtypeHover = "";

/**
 * @description It is used to split the name and password for lower urls environments, which was used to validate the home page.
 * @param {string} plat - plat should be pc or mob.
 * @returns url after spliting for lower environments otherwise return the base url.
 */

function Splittingurl(plat) {
	var newurl = "";
	if (getBaseURL(plat).includes("@")) {
		var [first, second] = getBaseURL(plat).split("@");
		newurl = "https://" + second;
		return newurl;
	} else {
		return getBaseURL(plat);
	}
}

/**
 * @description It is used to perfom click action on the element if exists
 * @example It can be used to close intermittent popups between pages.
 * @param {var} element - The locator of the element.
 * @param {string} custommessage - It would be a proper message depending on the scenario on try block
 * @param {string} custommessage2 - It would be a proper message depending on the scenario on catch block.
 */

async function Trycatchclick(element, custommessage, custommessage2) {
	if (element.localeCompare("") != 0) {
		try {
			await click(await $(element));
			gauge.message(custommessage);
		} catch (error) {
			gauge.message(custommessage2);
		}
	}
}

/**
 * @description It is used to check if the element exists on the page and focus and click on it if not returns else part message.
 * @param {var} element - The locator of the element.
 * @param {string} customtext- It would be a proper message depending on the scenario inside if.
 * @param {string} elsecustomtext- It would be a proper message depending on the scenario on else part.
 */
async function FocusAndClick(element, customtext, elsecustomtext) {
	if (element.localeCompare("") != 0) {
		if (await (await $(element)).exists(100, 20000)) {
			await evaluate(await $(element, {waitForEvents: ["loadEventFired"]}), ele => {
				ele.focus();
				ele.click();
			});
			gauge.screenshot();
			gauge.message(customtext);
		} else {
			gauge.message(elsecustomtext);
		}
	} else {
		gauge.message("This step is not applicable for this Brand/Locale");
	}
}

/**
 * @description It is used to check the MPP grid is completely loaded, otherwise it tries to reload it and check it again otherwise fails.
 */

async function VerifyMPPGrid() {
	let MPPGridcount = 0;
	for (i = 0; i < 2; i++) {
		await scrollDown(parseInt(ScrollDownvalue));
		var MPPtitle = await evaluate(() => {
			return document.title;
		});
		if (await (await $(MPPpagegrid)).exists(100, 20000)) {
			gauge.message("In MPP, grid loading is completed as expected.");
			gauge.message("MPP page title :" + MPPtitle);
			break;
		} else {
			await reload({waitForEvents: ["DOMContentLoaded"]});
			gauge.message("Page hasn't loaded thus reloading the page.");
			MPPGridcount++;
		}
	}
	if (MPPGridcount === 2) {
		assert(false, "MPP grid is not loaded after re-loading the page twice.");
	}
}

/**
 * @description It is used to check if the element exists on the page if not return false.
 * @param {var} element - The locator of the element.
 * @param {string} custommessage - It would be a proper message depending on the scenario.
 * @param {string} elsecustommessage - It would be a proper message depending on the scenario.
 */

async function VerifyElementexists(element, custommessage, elsecustommessage) {
	if (element.localeCompare("") != 0) {
		if (await (await $(element)).exists(100, 20000)) {
			gauge.message(custommessage);
		} else {
			assert(false, elsecustommessage);
		}
	} else {
		gauge.message("This step is not applicable for this Brand/Locale");
	}
}

/**
 * @description It is used to check if the element visible on the page if not return not visible and fails.
 * @param {var} element - The locator of the element.
 * @param {string} custommessage - It would be a proper message depending on the scenario.
 * @param {string} elsecustommessage - It would be a proper message depending on the scenario.
 */

async function VerifyElementIsVisible(element, custommessage, elsecustommessage) {
	if (element.localeCompare("") != 0) {
		if (await (await $(element)).isVisible(100, 20000)) {
			gauge.message(custommessage);
		} else {
			assert(false, elsecustommessage);
		}
	} else {
		gauge.message("This step is not applicable for this Brand/Locale");
	}
}

/**
 * @description It is used to check that the product class exists in MPP and retrieve the product name text and click on it otherwise it fails.
 * @param {var} ProductView - The locator of the product view class in Mpp.
 * @param {var} Producttext - The locator of the product view name in Mpp.
 */

async function ClickonProductview(ProductView, Producttext) {
	if (ProductView.localeCompare("") != 0) {
		await scrollDown(parseInt(ScrollDownvalue));
		let tProducttext = await $(Producttext);
		//if (await tProducttext.exists(100, 30000)) {
		Productname = await evaluate(tProducttext, ele => {
			return ele.innerText;
		});
		//Productname = await tProducttext.text();
		console.log("Selected Productname in MPP : " + Productname);
		await evaluate(await $(ProductView, {waitForEvents: ["loadEventFired"]}), ele => ele.click());
		gauge.screenshot();
		//} else {
		//  assert(false, 'Element is not exists within 30 seconds/Locator change.');
		// }
	} else {
		gauge.message("This step is not applicable for this Brand/Locale");
	}
}

/**
 * @description It is used to check if the element exists on the page and click on it if not return false.
 * @param {var} element - The locator of the element.
 * @param {string} custommessage - It would be a proper message depending on the scenario.
 */

async function VerifyElementExistsandClick(element, custommessage, elsecustommessage) {
	if (element.localeCompare("") != 0) {
		if (await (await $(element)).exists(100, 20000)) {
			await evaluate(await $(element, {waitForEvents: ["loadEventFired"]}), ele => {
				ele.focus();
				ele.click();
			});
			gauge.screenshot();
			gauge.message(custommessage);
		} else {
			assert(false, elsecustommessage);
		}
	} else {
		gauge.message("This step is not applicable for this Brand/Locale");
	}
}

/**
 * @description It is used to verify the selected product and the product which is added to cart is same if not return false.
 * @param {var} ProductName - The text of the product name retrieved on MPP.
 */

async function ValidateproductinCart(UIproductname) {
	var CPurl = await currentURL();
	if (CPurl.includes(CartpageURLText)) {
		gauge.message("Navigated to Cartpage as expected");
		gauge.message("Selected product name :" + Productname);
		if (await text(Productname).exists()) {
			assert(true);
			gauge.message("Selected Product and product which is added to cart is same");
		} else if (UIproductname.localeCompare("") != 0) {
			var producttextoncart = await (await $(UIproductname)).text();
			assert(producttextoncart.includes(Productname));
			gauge.message("Product name in cartpage :" + producttextoncart);
			gauge.message("Selected Product and product which is added to cart is same");
		} else {
			assert(false, "Selected product not added to the cart");
		}
		gauge.screenshot();
	} else {
		assert(false, "Not in Cartpage");
	}
}

/**
 * @description It is used to close all the visible popup's
 */

async function Lookforpopupsandclose() {
	let PopupCount = 0;
	if (Closepopup.localeCompare("") != 0) {
		let tClosepopup = await $(Closepopup);
		if (await tClosepopup.exists()) {
			await evaluate(tClosepopup, ele => ele.click());
			PopupCount++;
		}
	}
	if (CloseSecpopup.localeCompare("") != 0) {
		let tCloseSecpopup = await $(CloseSecpopup);
		if (await tCloseSecpopup.exists()) {
			await evaluate(tCloseSecpopup, ele => ele.click());
			PopupCount++;
		}
	}
	if (Closethirdpopup.localeCompare("") != 0) {
		let tClosethirdpopup = await $(Closethirdpopup);
		if (await tClosethirdpopup.exists()) {
			await evaluate(tClosethirdpopup, ele => ele.click());
			popUpFlag = 1;
		}
	}
	if (PopupCount == 0) {
		gauge.message("no pop ups appeared");
	} else {
		gauge.message("pop ups closed");
	}
}

//**Front end sanity steps**//

var TimeoutSetting = "";
var MPPUrl = "";
var Closepopup = "";
var CloseSecpopup = "";
var Closethirdpopup = "";
var Javaalertpopupmpp = "";
var Javaalertpopupspp = "";

step("SANITYMPPSPP Initialize Helix", async function () {
	// Initialize the selectors from DB
	//await initFrameworkSettings();
});

step("SANITYMPPSPP Set Cookies and Revision tag <plat>", async function (plat) {
	setConfig({navigationTimeout: parseInt(TimeoutSetting, 10)});
	await resizeWindow({width: 1600, height: 860});
	await deleteCookies();
	await setCookie("NM_AE", "04042020", {url: getBaseURL(plat)});
	await setCookie("__adroll", "opt_out", {url: getBaseURL(plat)});
	gauge.message("ENVIRONMENT : " + envir);
	if (akamaiBypass == "true") {
		await setCookie("BYPASS_AKAMAI", "1", {url: getBaseURL(plat)});
		gauge.message("AKAMAI BYPASS IS SET TO 1");
	} else {
		await setCookie("BYPASS_AKAMAI", "0", {url: getBaseURL(plat)});
		gauge.message("AKAMAI BYPASS IS SET TO 0");
	}
	if (!(apiEnv == "" || envir.toUpperCase() == "PROD" || envir.toUpperCase() == "PREPROD")) {
		await setCookie("ELC_SITE_MICROSERVICES_ENVIRONMENT", apiEnv, {
			url: getBaseURL(plat),
		});
	}
	await setCookie("SHOWERRORS", "1", {url: getBaseURL(plat)});
	await setCookie("WAF-Bypass", "c5hFKywmUdMddbh7", {url: getBaseURL(plat)});
	if (varnishBypass.toLowerCase() !== "false" && (envir.toUpperCase() == "PROD" || envir.toUpperCase() == "PREPROD")) {
		await setCookie("BYPASS_VARNISH", "1", {url: getBaseURL(plat)});
		gauge.message("VARNISH BYPASS IS SET TO 1");
	}
	await getPerlgemEnvCookie(plat);
	if (allCookies.localeCompare("") != 0) {
		let cookiesList = allCookies.split(",");
		for (let i = 0; i < cookiesList.length; i++) {
			let [cookieName, cookieVal] = cookiesList[i].split(":");
			await setCookie(cookieName, cookieVal, {url: getBaseURL(plat)});
		}
	}
	await setRevTag(plat);
});

step("SANITYMPPSPP Open Home Page <plat>", async function (plat) {
	await goto(getBaseURL(plat), {waitForEvents: ["DOMContentLoaded"]});
	await Lookforpopupsandclose();
	gauge.screenshot();
});

step("SANITYMPPSPP Mobile Device Emulation", async function () {
	await emulateDevice("iPhone X");
	gauge.message("Device Emulation set to: iPhone X");
});

var Countryname = "";
var ChooseLanguage = "";
var HubsiteSubmitbtn = "";
var Hubsiteextensionurl = "";

step("SANITYMPPSPP Choose Country & Language", async function () {
	if (Countryname.localeCompare("") != 0) {
		await click(text(Countryname));
		gauge.message(Countryname + " Country is selected");
		if (ChooseLanguage.localeCompare("") != 0) {
			await click(text(ChooseLanguage));
			gauge.message(ChooseLanguage + " Langugage is selected");
			gauge.screenshot();
		}
		if (await (await $(HubsiteSubmitbtn)).exists()) {
			await evaluate(await $(HubsiteSubmitbtn, {waitForEvents: ["loadEventFired"]}), ele => ele.click());
		} else {
			gauge.message("Submit btn not available");
		}
	} else {
		gauge.message("This step is not applicable for this brand/locale");
	}
});

step("SANITYMPPSPP Verify Home page for the selected Country displayed properly <plat>", async function (plat) {
	var HPurl = await currentURL();
	var HPtitle = await evaluate(() => {
		return document.title;
	});
	/*Validate the user on the homepage by using the retrieved URL from the user interface with the URL provided. And replace(/\/$/, '') is used to remove the slash at the end of the string*/
	if (
		HPurl.toLowerCase().replace(/[^a-zA-Z0-9 ]/g, "") ==
		Splittingurl(plat)
			.toLowerCase()
			.replace(/[^a-zA-Z0-9 ]/g, "") +
			Hubsiteextensionurl.toLowerCase().replace(/[^a-zA-Z0-9 ]/g, "")
	) {
		assert(true);
		gauge.message("In Homepage and the current page title is : " + HPtitle);
	} else if (
		HPurl.toLowerCase().replace(/[^a-zA-Z0-9 ]/g, "") ==
		Splittingurl(plat)
			.toLowerCase()
			.replace("m.", "www.")
			.replace(/[^a-zA-Z0-9 ]/g, "") +
			Hubsiteextensionurl.toLowerCase().replace(/[^a-zA-Z0-9 ]/g, "")
	) {
		assert(true);
		gauge.message("In Homepage and page title is : " + HPtitle);
	} else {
		assert(false, "Not in Homepage and the current page title is : " + HPtitle);
	}
});

step("SANITYMPPSPP Verify that the user is able to add products to the cart successfully from MPP Quick View <plat>", async function (plat) {
	await goto(getBaseURL(plat) + MPPUrl, {
		waitForEvents: ["DOMContentLoaded"],
	});
	await VerifyMPPGrid();
	if (plat == "PC") {
		await FocusAndClick(QuickViewClass, "Quick view exists and able to click on it in MPP", "Quick view not exists/not available for this brand");
	} else {
		await FocusAndClick(QuickViewClassMob, "Quick view exists and able to click on it in MPP", "Quick view not exists/not available for this brand");
	}
	if (Javaalertpopupmpp.localeCompare("") != 0) {
		alert(Javaalertpopupmpp, async () => await accept());
	}
	if (await (await $(AddToBagMPP)).exists()) {
		await evaluate(await $(AddToBagMPP, {waitForEvents: ["loadEventFired"]}), ele => ele.click());
		gauge.message("Product added to bag in MPP");
		gauge.screenshot();
	} else {
		gauge.message("Add to bag is not present in MPP");
	}
});

step("SANITYMPPSPP Verify that the user is able to navigate to SPP for the product selected from MPP <plat>", async function (plat) {
	if (plat == "PC") {
		await ClickonProductview(ProductViewClass, ProductViewtext);
		await VerifyElementexists(SPPpageprodHeader, "In SPP", "Not in SPP");
	} else {
		await ClickonProductview(MobProductViewClass, MobProductViewtext);
		await VerifyElementexists(SPPpageprodHeaderMob, "In SPP", "Not in SPP");
	}
});

step("SANITYMPPSPP Verify that the user is able to add products to the cart successfully from SPP", async function () {
	if (Javaalertpopupspp.localeCompare("") != 0) {
		alert(Javaalertpopupspp, async () => await accept());
	}
	if (await (await $(AddToBagSPP)).exists(100, 30000)) {
		if ((await (await $(AddToBagSPP)).isDisabled()) != true) {
			await evaluate(await $(AddToBagSPP, {waitForEvents: ["loadEventFired"]}), ele => ele.click());
			gauge.message("Add to Bag btn is enabled and Product added to bag in SPP");
			gauge.screenshot();
		} else {
			assert(false, "Add to Bag btn is disabled in SPP");
		}
	} else {
		assert(false, "Add to Bag btn is not available within 30 seconds/Item is out of stock/comingsoon.");
	}
});

step("SANITYMPPSPP Verify that the user is able to view the added product in the Cart <plat>", async function (plat) {
	if (plat == "PC") {
		await VerifyElementExistsandClick(ClickCartpageLink, "Cart overlay exists and able to click", "Cart overlay doesn't exists");
		await ValidateproductinCart(CartProductnameLoc);
	} else {
		await VerifyElementExistsandClick(ClickCartpageLinkMob, "Cart overlay exists and able to click", "Cart overlay doesn't exists");
		await ValidateproductinCart(CartProductnameLocMob);
	}
});

step("SANITYMPPSPP Go back to previous page", async function (plat) {
	await goBack({waitForEvents: ["loadEventFired"]});
});

/**Bag Icon check step */

var BagIconlink = "";
var BagIconlinkMob = "";
var CheckoutOverlaypopup = "";
var CheckoutOverlaypopupMob = "";
var Overlayclosebtn = "";

step("SANITYMPPSPP Verify that the user is able to view the added product in the Cart by clicking on Bag Icon <plat>", async function (plat) {
	if (plat == "PC") {
		await VerifyElementExistsandClick(Overlayclosebtn, "", "");
		await VerifyElementExistsandClick(BagIconlink, "Bag Icon exists and able to click", "Bag Icon doesn't exists");
		await VerifyElementexists(CheckoutOverlaypopup, "Cart overlay displays", "Cart overlay doesn't displays");
		await VerifyElementIsVisible(ClickCartpageLink, "Checkout btn is visible", "Checkout btn is not visible");
		await ValidateproductinCart(CartProductnameLoc);
	} else {
		await VerifyElementExistsandClick(BagIconlinkMob, "Bag Icon exists and able to click", "Bag Icon doesn't exists");
		await ValidateproductinCart(CartProductnameLoc);
	}
});

/**Login to ELC user account step for Beauty perks site */

var ClickElcEmployeeButton = "";
var ReturnUserSigninButton = "";
var ACEnterEmail = "";
var ACEnterPassword = "";

step("SANITYMPPSPP Click Elc Employee button and type E-mail, Password and click Sign In <plat>", async function (plat) {
	if (ClickElcEmployeeButton.localeCompare("") != 0) {
		await evaluate(
			await $(ClickElcEmployeeButton, {
				waitForEvents: ["DOMContentLoaded"],
			}),
			ele => ele.click()
		);
		if (ACEnterEmail.localeCompare("") != 0) {
			let tACEnterEmail = await $(ACEnterEmail);
			let tACEnterPassword = await $(ACEnterPassword);
			if (await tACEnterEmail.exists(100, 20000)) {
				await evaluate(tACEnterEmail, ele => ele.focus());
				await write(CommonData.ACEMAIL, into(tACEnterEmail));
				await evaluate(tACEnterPassword, ele => ele.focus());
				await write(CommonData.ACPWD, into(tACEnterPassword));
				gauge.screenshot();
			} else {
				assert(false, "The email textbox doesn't exists within 20 seconds");
			}
		}
		if (ReturnUserSigninButton.localeCompare("") != 0) {
			let tReturnUserSigninButton = await $(ReturnUserSigninButton);
			if (await tReturnUserSigninButton.exists(100, 20000)) {
				await evaluate(tReturnUserSigninButton, ele => {
					ele.focus();
					ele.click();
				});
			} else {
				assert(false, "signin btn doesn't exists within 20 seconds");
			}
		}
		await goto(getAdmURL(plat) + "/shared/deletecart.tmpl", {
			waitForEvents: ["loadEventFired"],
		});
		gauge.message("Products deleted from cart after login");
		await goto(getBaseURL(plat), {waitForEvents: ["loadEventFired"]});
	} else {
		gauge.message("This step is not applicable for this brand/locale");
	}
});
