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

    def build_geneartion(self, payload, collection='generation'):
        payload['feedback'] = []
        insert_gen = self.chatdb[collection].insert_one(payload)
        payload['_id'] = insert_gen.inserted_id
        return payload

    def feedback(self, query_id, feedback_dict, collection='generation'):
        if not isinstance(query_id, ObjectId):
            query_id = ObjectId(query_id)
        if feedback_dict.get('query_id', None):
            del feedback_dict['query_id']
        generation_dict = self.chatdb[collection].find_one({'_id': query_id})
        generation_dict['feedback'].append(feedback_dict)
        self.chatdb[collection].update_one({'_id': query_id}, {'$set': generation_dict})
        return True
    
    def get(self, query_id="", collection='generation'):
        if not isinstance(query_id, ObjectId):
            query_id = ObjectId(query_id)
        return self.chatdb[collection].find_one({'_id': query_id})

    def update(self, query_id, content, collection='generation'):
        if not isinstance(query_id, ObjectId):
            query_id = ObjectId(query_id)
        self.chatdb[collection].update_one({'_id': query_id}, {'$set': content})
        return True

    def export_feedback(self, collection='generation'):
        data = self.chatdb[collection].find()
        results = []
        for i, generation in enumerate(data):
            del generation['_id']
            results.append(generation)

        return results
    
    def drop_collection(self, collection='generation'):
        self.chatdb[collection].drop()
        return True