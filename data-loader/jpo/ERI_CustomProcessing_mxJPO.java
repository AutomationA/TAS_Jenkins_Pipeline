


import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

import com.dassault_systemes.enovia.enterprisechangemgt.common.ChangeAction;
import com.dassault_systemes.enovia.partmanagement.modeler.impl.UserFactChangeLogService;
import com.dassault_systemes.enovia.partmanagement.modeler.interfaces.services.IUserFactChangeLogService;
import com.dassault_systemes.enovia.partmanagement.modeler.util.ECMUtil;
import com.matrixone.apps.common.CommonDocument;
import com.matrixone.apps.domain.DomainConstants;
import com.matrixone.apps.domain.DomainObject;
import com.matrixone.apps.domain.util.FrameworkException;
import com.matrixone.apps.domain.util.MapList;
import com.matrixone.apps.domain.util.MqlUtil;
import com.matrixone.apps.domain.util.PropertyUtil;
import com.matrixone.apps.framework.ui.UIUtil;

import matrix.db.BusinessObject;
import matrix.db.Context;
import matrix.util.StringList;

public class ERI_CustomProcessing_mxJPO {
	
	
	
	public static String getConnectedObjectID(Context context,String strType,String strName,String strRevision,String relationshipName,String sideOfTNR, String otherSideValue)
	{
		String strConnectedObjectId = "";
		if (UIUtil.isNotNullAndNotEmpty(strType) && UIUtil.isNotNullAndNotEmpty(strName)) {

			try {
				String[] objectArgs = { strType.trim(), strName.trim(),
						UIUtil.isNotNullAndNotEmpty(strRevision) ? strRevision.trim() : "", sideOfTNR+"["+relationshipName+"]."+otherSideValue+".id", "|" };
				strConnectedObjectId = MqlUtil.mqlCommand(context, "print bus $1 $2 $3 select $4 dump $5", objectArgs);

			} catch (Exception e) {
				e.printStackTrace();
			}
		}
		return strConnectedObjectId;
	}
	
	
	
	public static void postProcessingForAddBus(Context context, String[] args) throws Exception {
		try {
			if (!args[0].contains("=")) {
				if(args[0].equalsIgnoreCase("ERI_ABCClass"))
				{
					//postProcessingForABCClass(context, args);
				}
				else 
				{
					//postProcessingForAddProduct(context, args);
				}	
			} else {
				Map<String, String> mapObjectData = new HashMap<String, String>();
				for (String sArgument : args) {
					String[] sArgumentParts = sArgument.split("=");
					if(sArgumentParts.length == 2)
						mapObjectData.put(sArgumentParts[0], sArgumentParts[1]);
				}

				String sType = getStringValueFromMap(mapObjectData, "type", "");

				if (sType.equals("ERI_Document")) {
					//postProcessingForAddDocument(context, mapObjectData);
					//postProcessingForAddDocument_deepak(context, mapObjectData);
				}
			}
		} catch (Exception ex) {
			ex.printStackTrace();
			throw new Exception(ex.getMessage());
		}
	}

	public static boolean isAlpha(String name) {
		return name.matches("[a-zA-Z]+");
	}

	public static String getStringValueFromMap(Map mapObjectMap, String sKey, String sDefaultValue) throws Exception {
		String sValue = sDefaultValue;
		try {
			String sTempValue = (String) mapObjectMap.get(sKey);
			if (UIUtil.isNotNullAndNotEmpty(sTempValue)) {
				sValue = sTempValue;
			}
		} catch (Exception e) {
			e.printStackTrace();
		}
		return sValue;
	}

	public void getChangeAction(Context context, String[] args) throws Exception {
		
		String partObjectId = "36523.16146.30009.16659";
		StringList slObjectSelects= new StringList();
		slObjectSelects.add(DomainConstants.SELECT_ID);
		slObjectSelects.add(DomainConstants.SELECT_NAME);

		Map realizedCAData = com.dassault_systemes.enovia.enterprisechangemgt.util.ChangeUtil.getChangeObjectsInRealized(context, slObjectSelects, new String[]{partObjectId}, 1);
		Map proposedCAData = com.dassault_systemes.enovia.enterprisechangemgt.util.ChangeUtil.getChangeObjectsInProposed(context, slObjectSelects, new String[]{partObjectId}, 1); 
		
		System.out.println("realizedCAData: "+realizedCAData);
		System.out.println("proposedCAData: "+proposedCAData);
		
		ChangeAction changeAction = new ChangeAction("36523.16146.30009.16659");
		MapList mlProposedObjList   = changeAction.getAffectedItems(context); 
		System.out.println("mlProposedObjList: "+mlProposedObjList);
		
		MapList mlRealizedObjList   =changeAction.getRealizedChanges(context);
		System.out.println("mlRealizedObjList: "+mlRealizedObjList);
		
		

	}
	public static void addToChangeAction(Context context, String[] args) throws Exception {
	
		String CA_ID = args[0];
		String PART_ID = args[1];
		String strRelationsihpName = args[2];
		
		if("PROPOSED_CHANGE".equals(strRelationsihpName))
		{
			ChangeAction changeAction = new ChangeAction(CA_ID);
			HashMap mpInvalidObjects = (HashMap)changeAction.connectAffectedItems(context, new StringList(PART_ID));
			String strInvalidObjectts = (String)mpInvalidObjects.get("strErrorMSG");
			if(strInvalidObjectts != null && !"".equals(strInvalidObjectts))
			{
				throw new Exception("Error while connecting Proposed change object "+strInvalidObjectts);
			}
		}
		else if("REALIZED_CHANGE".equals(strRelationsihpName))
		{
			ECMUtil.setWorkUnderChange(context, CA_ID);
			IUserFactChangeLogService iUserFactChangeLogService = new UserFactChangeLogService();
			iUserFactChangeLogService.updateObjectUserFact(context, new StringList(PART_ID), IUserFactChangeLogService.USER_EVENT_OBJECT_CREATE);
		}
				
	}
	public static void postProcessingForConnectBus(Context context, String[] args) throws Exception {
		try {
			if (args.length < 7) {
				return;
			}
			String sRelationshipName = (String) args[0];
			String sFromType = (String) args[1];
			String sFromName = (String) args[2];
			String sFromRevision = (String) args[3];
			String sToType = (String) args[4];
			String sToName = (String) args[5];
			String sToRevision = (String) args[6];
			
			if("Change Action".equals(sFromName))
			{
				String CA_ID =  getObjectIdFromTNR(context, sFromType, sFromName, sFromRevision);
				String PART_ID = getObjectIdFromTNR(context, sToType, sToName, sToRevision);
				
				String[] args1 = {CA_ID, PART_ID, sRelationshipName};
				addToChangeAction(context, args1);
			}
			
			
		} catch (Exception ex) {
			ex.printStackTrace();
			throw new Exception(ex.getMessage());
		}
	}

	public static String executeMQL(Context context, String strMqlCommand) {
		String strResult = "";
		try {
			//System.out.println("strMqlCommand: "+strMqlCommand);
			strResult = MqlUtil.mqlCommand(context, strMqlCommand);
		} catch (Exception e) {
			//System.out.println("Error: "+e.getMessage());
		}
		return strResult;
	}

	public static String getObjectIdFromTNR(Context context, String strType, String strName, String strRevision) {
		String strObjectId = "";
		if (UIUtil.isNotNullAndNotEmpty(strType) && UIUtil.isNotNullAndNotEmpty(strName)) {

			try {
				String[] objectArgs = { strType.trim(), strName.trim(),
						UIUtil.isNotNullAndNotEmpty(strRevision) ? strRevision.trim() : "", "id", "|" };
				strObjectId = MqlUtil.mqlCommand(context, "print bus $1 $2 $3 select $4 dump $5", objectArgs);

			} catch (Exception e) {
				e.printStackTrace();
			}
		}
		return strObjectId;
	}
		
	public static String getPhysicalIdFromObjectId(Context context, String sABCClassId) throws Exception {
		String[] objectArgs = { sABCClassId.trim(), "physicalid", "|" };
		String strObjectId = MqlUtil.mqlCommand(context, "print bus $1 select $2 dump $3", objectArgs);
		return strObjectId;
	}

	public static void postProcessingForDeleteBus(Context context, String[] args) throws Exception {
		Map<String, String> mapObjectData = new HashMap<String, String>();
			for (String sArgument : args) {
				String[] sArgumentParts = sArgument.split("=");
				if(sArgumentParts.length == 2)
					mapObjectData.put(sArgumentParts[0], sArgumentParts[1]);
			}

			String sType = getStringValueFromMap(mapObjectData, "type", "");
			String sName = getStringValueFromMap(mapObjectData, "name", "");
			String sRevision = getStringValueFromMap(mapObjectData, "revision", "");		

		try {
			//String sObjectId = getObjectIdFromTNR(context, sType, sName, sRevision);
		} catch (Exception ex) {
			ex.printStackTrace();
			
		executeMQL(context, "trigger off");
			String strObjectId = executeMQL(context,"print bus \""+sType+"\" \""+sName+"\" \""+sRevision+"\" select to[ERI_DocumentRevision].from.id  to[ERI_DocumentReference].from.id from[ERI_Format].to.id dump |");

			String[] deleteObjectIds = strObjectId.split("\\|");
			for(String objId : deleteObjectIds)
			{
				executeMQL(context, "delete bus "+objId);
			}
			executeMQL(context, "delete bus \""+sType+"\" \""+sName+"\" \""+sRevision+"\" ");
			executeMQL(context,"trigger on");
		}
	}
	
	public void postProcessingForDeleteBusNoRevision(Context context, String[] args)
	{
		String strAllObjectsList  = executeMQL(context, "temp query bus '"+args[0]+"' '"+args[1]+"' '*' select id dump |;");
		deleteObjectsFromList(context, strAllObjectsList);
		
	}
	
	public void deleteObjectsFromList(Context context, String strAllObjectsList)
	{
		if(UIUtil.isNotNullAndNotEmpty(strAllObjectsList))
		{
			String[] saObjectDeleteList = strAllObjectsList.split("\\n");
			int iTotal = saObjectDeleteList.length;
			for(int iObjectIndex = 0; iObjectIndex <iTotal ; iObjectIndex++)
			{
				String strObjectDetails = saObjectDeleteList[iObjectIndex];
				try
				{
					executeMQL(context, "delete bus "+strObjectDetails.split("\\|")[3]);
				}
				catch(Exception e)
				{
					e.printStackTrace();
				}
			}
		}
	}
}
