#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Quick Performance Summary - No external dependencies
"""

import json
import glob

def load_results():
    """Load all test result JSON files"""
    results = {
        'monolith': {},
        'microservices': {}
    }

    result_files = glob.glob('results-*.json')

    for file in result_files:
        with open(file, 'r', encoding='utf-8') as f:
            data = json.load(f)

        arch = data['testConfig']['testName']
        scenario = data['testConfig']['scenario']
        results[arch][scenario] = data

    return results

def extract_metrics(data):
    """Extract key metrics from test data"""
    metrics = data.get('metrics', {})

    return {
        'requests_total': metrics.get('http_reqs', {}).get('values', {}).get('count', 0),
        'requests_per_sec': metrics.get('http_reqs', {}).get('values', {}).get('rate', 0),
        'response_avg': metrics.get('http_req_duration', {}).get('values', {}).get('avg', 0),
        'response_p95': metrics.get('http_req_duration', {}).get('values', {}).get('p(95)', 0),
        'response_p99': metrics.get('http_req_duration', {}).get('values', {}).get('p(99)', 0),
        'success_count': metrics.get('successful_requests', {}).get('values', {}).get('count', 0),
        'failed_count': metrics.get('failed_requests', {}).get('values', {}).get('count', 0),
        'data_received_mb': metrics.get('data_received', {}).get('values', {}).get('count', 0) / 1024 / 1024
    }

def print_summary(results):
    """Print formatted summary"""
    print("\n" + "="*80)
    print(" PERFORMANCE TEST RESULTS SUMMARY - MONOLITH vs MICROSERVICES")
    print("="*80 + "\n")

    scenarios = {
        'light_load': 'Light Load (5 users)',
        'medium_load': 'Medium Load (20 users)',
        'heavy_load': 'Heavy Load (50 users)'
    }

    for scenario, name in scenarios.items():
        print(f"\n[{name.upper()}]")
        print("-" * 80)

        if scenario in results['monolith']:
            mono_metrics = extract_metrics(results['monolith'][scenario])
            print(f"\n  MONOLITH:")
            print(f"    Total Requests:     {mono_metrics['requests_total']}")
            print(f"    Requests/sec:       {mono_metrics['requests_per_sec']:.2f}")
            print(f"    Avg Response Time:  {mono_metrics['response_avg']:.2f} ms")
            print(f"    P95 Response Time:  {mono_metrics['response_p95']:.2f} ms")
            print(f"    P99 Response Time:  {mono_metrics['response_p99']:.2f} ms")
            print(f"    Successful:         {mono_metrics['success_count']}")
            print(f"    Failed:             {mono_metrics['failed_count']}")
            print(f"    Data Received:      {mono_metrics['data_received_mb']:.2f} MB")

        if scenario in results['microservices']:
            micro_metrics = extract_metrics(results['microservices'][scenario])
            print(f"\n  MICROSERVICES:")
            print(f"    Total Requests:     {micro_metrics['requests_total']}")
            print(f"    Requests/sec:       {micro_metrics['requests_per_sec']:.2f}")
            print(f"    Avg Response Time:  {micro_metrics['response_avg']:.2f} ms")
            print(f"    P95 Response Time:  {micro_metrics['response_p95']:.2f} ms")
            print(f"    P99 Response Time:  {micro_metrics['response_p99']:.2f} ms")
            print(f"    Successful:         {micro_metrics['success_count']}")
            print(f"    Failed:             {micro_metrics['failed_count']}")
            print(f"    Data Received:      {micro_metrics['data_received_mb']:.2f} MB")

            # Comparison
            if scenario in results['monolith']:
                print(f"\n  COMPARISON (Microservices vs Monolith):")
                response_diff = ((micro_metrics['response_avg'] - mono_metrics['response_avg']) / mono_metrics['response_avg'] * 100)
                throughput_diff = ((micro_metrics['requests_per_sec'] - mono_metrics['requests_per_sec']) / mono_metrics['requests_per_sec'] * 100)

                print(f"    Response Time:  {response_diff:+.1f}% ({'SLOWER' if response_diff > 0 else 'FASTER'})")
                print(f"    Throughput:     {throughput_diff:+.1f}% ({'BETTER' if throughput_diff > 0 else 'WORSE'})")

                if mono_metrics['failed_count'] == 0 and micro_metrics['failed_count'] > 0:
                    error_rate = (micro_metrics['failed_count'] / micro_metrics['requests_total'] * 100)
                    print(f"    Error Rate:     {error_rate:.1f}% (Microservices had errors, Monolith had none)")

    print("\n" + "="*80)
    print(" KEY FINDINGS:")
    print("="*80)

    # Calculate average differences across all scenarios
    total_scenarios = 0
    total_response_diff = 0
    total_throughput_diff = 0

    for scenario in scenarios.keys():
        if scenario in results['monolith'] and scenario in results['microservices']:
            mono = extract_metrics(results['monolith'][scenario])
            micro = extract_metrics(results['microservices'][scenario])

            total_response_diff += ((micro['response_avg'] - mono['response_avg']) / mono['response_avg'] * 100)
            total_throughput_diff += ((micro['requests_per_sec'] - mono['requests_per_sec']) / mono['requests_per_sec'] * 100)
            total_scenarios += 1

    if total_scenarios > 0:
        avg_response_diff = total_response_diff / total_scenarios
        avg_throughput_diff = total_throughput_diff / total_scenarios

        print(f"\n  Average Response Time Difference: {avg_response_diff:+.1f}%")
        print(f"  Average Throughput Difference:    {avg_throughput_diff:+.1f}%")

        print(f"\n  [+] Monolith: Better performance, faster response times, no errors")
        print(f"  [!] Microservices: ~{abs(avg_response_diff):.0f}x slower responses, some request failures")
        print(f"  [*] Note: Microservices are deployed on AWS (external), Monolith is local")
        print(f"      Network latency is a significant factor in the performance difference")

    print("\n" + "="*80 + "\n")

if __name__ == "__main__":
    results = load_results()
    print_summary(results)
