import os
import json
import argparse
import pymongo

from backend.mongodb import MongoDBPool
from arguments import mongo_config, cache_dir

# parse terminal arguments
parser = argparse.ArgumentParser()

parser.add_argument('--operation', type=str, choices=['export', 'delete'], required=True)

# export configuration
parser.add_argument('--output_dir', type=str, default=os.path.join(cache_dir, 'feedback'))
parser.add_argument('--output_name', type=str, default='chat_history')
parser.add_argument('--split_size', type=int, default=0)
parser.add_argument('--verbose', action='store_true', default=False)
 
args = parser.parse_args()

mongotool = MongoDBPool()

if args.operation == 'delete':
    for collection_name in ['generation', 'user', 'feedback', 'chat']:
        mongotool.drop_collection(collection_name)
        print(f'Delete Collection {collection_name}.')   

elif args.operation == 'export':

    if not os.path.exists(args.output_dir):
        os.makedirs(args.output_dir)

    if args.split_size == 0:
        fout = open(os.path.join(args.output_dir, f'{args.output_name}.jsonl'), 'w')
        step = 1e12
    else:
        fout = open(os.path.join(args.output_dir, f'{args.output_name}_0.jsonl'), 'w')
        step = args.split_size
    
    results = mongotool.export_chat()
    
    for i, generation in enumerate(results):

        if args.verbose:
            print(json.dumps(generation, ensure_ascii=False, indent='  '))
        fout.write(json.dumps(generation, ensure_ascii=False)+'\n')
        
        if i % step == step - 1:
            fout.close()
            fout = open(os.path.join(args.output_dir, f'{args.output_name}_{i//step+1}.jsonl'), 'w')
