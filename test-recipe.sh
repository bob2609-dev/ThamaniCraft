#!/bin/bash
TOKEN=$(python3 scratch/get_token.py)
curl -v -H "Authorization: Bearer $TOKEN" http://thamanicraft-production-service:8081/recipes/d33d3167-7ada-416e-b9ab-6a0aa9308fb2
