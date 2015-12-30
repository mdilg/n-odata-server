/**
 * This module implements the odata server functionality
 * At the moment it is implemented as local loopback component
 * See here for more details on creating and registering loopback components
 * https://docs.strongloop.com/display/public/LB/Creating+components
 *
 */

// OData V4
import constants = require('./constants/odata_constants');
import common = require('./common/odata_common');
import ODataGetV4 = require('./v4/get/odata_get');
import ODataPostV4 = require('./v4/post/odata_post');
import ODataPutV4 = require('./v4/put/odata_put');
import ODataDeleteV4 = require('./v4/delete/odata_delete');
// OData V2
import ODataGetV2 = require('./v2/get/odata_get');
import ODataPostV2 = require('./v2/post/odata_post');
import ODataDeleteV2 = require('./v2/delete/odata_delete');

var oDataServerConfig;


/**
 * Exposes the main function of the n-odata-server
 */
export = function (loopbackApplication, options) {
	// save the options defined in a local variable
	oDataServerConfig = options || {};
	// if not defined set a default value for server-side paging
	if (!oDataServerConfig.maxpagesize) {
		oDataServerConfig.maxpagesize = constants.ODATA_MAXPAGESIZE;
	}

	// retrieve odata prefix from path
	var _pathArr = options.path.split('/');
	oDataServerConfig.odataPrefix = _pathArr[1];

	if (!oDataServerConfig.odataversion) {
		oDataServerConfig.odataversion = "4";
	}

	if (oDataServerConfig.odataversion === "4") {
		_handleODataVersion4.call(this, loopbackApplication, options, oDataServerConfig);
	} else if (oDataServerConfig.odataversion === "2") {
		_handleODataVersion2.call(this, loopbackApplication, options, oDataServerConfig);
	} else {
		console.log("odata version " + oDataServerConfig.odataversion + " not supported yet");
	}
};


/**
 * handles OData V2 requests
 *
 * @param loopbackApplication
 * @param options
 * @param oDataServerConfig
 * @private
 */
function _handleODataVersion2(loopbackApplication, options, oDataServerConfig) {
	this.oDataGet = new ODataGetV2.ODataGet();
	this.oDataPost = new ODataPostV2.ODataPost();
	this.oDataDelete = new ODataDeleteV2.ODataDelete();

	common.setConfig(oDataServerConfig);
	this.oDataGet.setConfig(oDataServerConfig);

	loopbackApplication.use(options.path, function (req, res, next) {
		try {
			switch (req.method) {
				case 'GET':
					_handleGet.call(this, req, res);
					break;
				case 'POST':
					_handlePost.call(this, req, res);
					break;
				//// PUT is used to update an entity and to overwrite all property values with its default
				//// values if they are not submitted with the request. In other words it resets an entity and
				//// only sets the submitted properties
				//case 'PUT':
				//	_handlePut.call(this, req, res);
				//	break;
				//// PATCH should be the preferred method to update an entity
				//case 'PATCH':
				//	_handlePATCH.call(this, req, res);
				//	break;
				//// MERGE is used in OData V2.0 to update an entity. This has been changed in
				//// in V4.0 to PATCH
				//case 'MERGE':
				//	_handlePATCH.call(this, req, res);
				//	break;
				case 'DELETE':
					_handleDelete.call(this, req, res);
					break;
				default:
					res.sendStatus(404);
					break;
			}
		} catch (e) {
			console.log(e);
			res.sendStatus(500);
		}
	});
}


/**
 * handles the OData V4 requests.
 *
 * @param loopbackApplication
 * @param options
 * @param oDataServerConfig
 * @private
 */
function _handleODataVersion4(loopbackApplication, options, oDataServerConfig) {
	this.oDataGet = new ODataGetV4.ODataGet();
	this.oDataDelete = new ODataDeleteV4.ODataDelete();
	this.oDataPost = new ODataPostV4.ODataPost();
	this.oDataPut = new ODataPutV4.ODataPut();

	common.setConfig(oDataServerConfig);
	this.oDataGet.setConfig(oDataServerConfig);

	loopbackApplication.use(options.path, function (req, res, next) {
		try {
			switch (req.method) {
				case 'GET':
					_handleGet.call(this, req, res);
					break;
				case 'POST':
					_handlePost.call(this, req, res);
					break;
				// PUT is used to update an entity and to overwrite all property values with its default
				// values if they are not submitted with the request. In other words it resets an entity and
				// only sets the submitted properties
				case 'PUT':
					_handlePut.call(this, req, res);
					break;
				// PATCH should be the preferred method to update an entity
				case 'PATCH':
					_handlePATCH.call(this, req, res);
					break;
				// MERGE is used in OData V2.0 to update an entity. This has been changed in
				// in V4.0 to PATCH
				case 'MERGE':
					_handlePATCH.call(this, req, res);
					break;
				case 'DELETE':
					_handleDelete.call(this, req, res);
					break;
				default:
					res.sendStatus(404);
					break;
			}
		} catch (e) {
			console.log(e);
			res.sendStatus(500);
		}
	});
}

/**
 * handles the GET request to the OData server
 * e.g. http://0.0.0.0:3000/odata/people
 * Here `people` is the pluralModelName of the Model to search
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
function _handleGet(req, res) {
	// delegate to get module
	this.oDataGet.handleGet(req, res);
}


/**
 * handles the POST request to the OData server.
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
function _handlePost(req, res) {
	// delegate to post module
	this.oDataPost.handlePost(req, res);
}

/**
 * handles the PUT request to the OData server. The PUT request is used to update an entity where
 * only the submitted properties are set. All other properties are reset to their default values.
 * Be aware that this could lead to data loss. If you only want to change the submitted properties
 * and keep all other properties values use PATCH or MERGE (only OData V2.0).
 * @param req
 * @param res
 * @private
 */
function _handlePut(req, res) {
	// delegate to put module
	this.oDataPut.handlePut(req, res);
}

/**
 * handles the PATCH request to the OData server. The PATCH request is used to update an entity where
 * only the submitted properties are set. The other properties of the entity will not be changed.
 * @param req
 * @param res
 * @private
 */
function _handlePATCH(req, res) {
	// delegate to put module
	this.oDataPut.handlePatch(req, res);
}


/**
 * handles the DELETE request of the OData server
 * @param req
 * @param res
 * @private
 */
function _handleDelete(req, res) {
	// delegate to delete module
	this.oDataDelete.handleDelete(req, res);
}



