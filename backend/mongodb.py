import pymongo
from bson.objectid import ObjectId

from arguments import api_config, mongo_config


class MongoDBPool(object):
    
    def __init__(self, host=None, port=None, database=None):
        if not host: host = mongo_config.host
        if not port: port = mongo_config.port
        if not database: database = mongo_config.database

        self.mongoclient = pymongo.MongoClient(host=host, port=port)
        self.chatdb = self.mongoclient[database]

    def build(self, payload, collection='generation'):
        insert_gen = self.chatdb[collection].insert_one(payload)
        payload['_id'] = insert_gen.inserted_id
        return payload
    
    def get(self, _id=None, condition={}, collection='generation'):
        if _id and not isinstance(_id, ObjectId):
            _id = ObjectId(_id)
            condition['_id'] = _id
        return self.chatdb[collection].find_one(condition)

    def update(self, _id, content={}, collection='generation'):
        if not isinstance(_id, ObjectId):
            _id = ObjectId(_id)
        self.chatdb[collection].update_one({'_id': _id}, {'$set': content})
        return True
    
    def export_chat(self):
        data = self.chatdb['chat'].find()
        results = []
        for i, chat in enumerate(data):
            chat['feedback'] = []
            for j, feedback_id in enumerate(chat['feedback_ids']):
                feedback_j = self.get(feedback_id, collection='feedback')
                del feedback_j['_id']
                chat['feedback'].append(feedback_j)

            del chat['_id']
            del chat['feedback_ids']
            results.append(chat)
        return results
    
    def drop_collection(self, collection='generation'):
        self.chatdb[collection].drop()
        return True