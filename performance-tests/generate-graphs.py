#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Performance Test Graph Generator
Generates comparison graphs for Monolith vs Microservices
"""

import json
import glob
import matplotlib.pyplot as plt
import numpy as np
from pathlib import Path

# Configure matplotlib for Serbian Cyrillic
plt.rcParams['font.family'] = 'DejaVu Sans'
plt.rcParams['axes.unicode_minus'] = False

class GraphGenerator:
    """Generates performance comparison graphs"""

    def __init__(self):
        self.results = {
            'monolith': {},
            'microservices': {}
        }
        self.scenarios = ['light_load', 'medium_load', 'heavy_load']
        self.scenario_labels = ['Лако\n(5 корисника)', 'Средње\n(20 корисника)', 'Тешко\n(50 корисника)']

    def load_results(self):
        """Load all test result JSON files"""
        print("Loading test results...")

        result_files = glob.glob('results-*.json')

        if not result_files:
            print("ERROR: No result files found!")
            return False

        for file in result_files:
            try:
                with open(file, 'r', encoding='utf-8') as f:
                    data = json.load(f)

                arch = data['testConfig']['testName']
                scenario = data['testConfig']['scenario']
                self.results[arch][scenario] = data
                print(f"  Loaded: {file}")

            except Exception as e:
                print(f"  ERROR loading {file}: {e}")
                return False

        return True

    def extract_metrics(self, data):
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
        }

    def generate_response_time_graph(self):
        """Generate response time comparison graph"""
        print("\nGenerating response time graph...")

        mono_avg = []
        micro_avg = []

        for scenario in self.scenarios:
            if scenario in self.results['monolith']:
                m = self.extract_metrics(self.results['monolith'][scenario])
                mono_avg.append(m['response_avg'])

            if scenario in self.results['microservices']:
                m = self.extract_metrics(self.results['microservices'][scenario])
                micro_avg.append(m['response_avg'])

        x = np.arange(len(self.scenario_labels))

        fig, ax = plt.subplots(figsize=(12, 6))

        # Line chart instead of bar chart
        line1 = ax.plot(x, mono_avg, marker='o', linewidth=2.5, markersize=8,
                        label='Монолит', color='#2ecc71', alpha=0.9)
        line2 = ax.plot(x, micro_avg, marker='s', linewidth=2.5, markersize=8,
                        label='Микросервиси', color='#e74c3c', alpha=0.9)

        ax.set_xlabel('Оптерећење', fontsize=12, fontweight='bold')
        ax.set_ylabel('Време одзива (ms)', fontsize=12, fontweight='bold')
        ax.set_title('Поређење просечног времена одзива: Монолит vs Микросервиси',
                     fontsize=14, fontweight='bold')
        ax.set_xticks(x)
        ax.set_xticklabels(self.scenario_labels)
        ax.legend(fontsize=11, loc='upper left')
        ax.grid(True, alpha=0.3, linestyle='--')

        # Add value labels on points
        for i, (mono_val, micro_val) in enumerate(zip(mono_avg, micro_avg)):
            ax.text(i, mono_val, f'{mono_val:.1f}ms', ha='center', va='bottom',
                   fontsize=9, fontweight='bold')
            ax.text(i, micro_val, f'{micro_val:.1f}ms', ha='center', va='bottom',
                   fontsize=9, fontweight='bold')

        plt.tight_layout()
        plt.savefig('graph-response-time.png', dpi=300, bbox_inches='tight')
        print("  Saved: graph-response-time.png")
        plt.close()

    def generate_throughput_graph(self):
        """Generate throughput comparison graph"""
        print("\nGenerating throughput graph...")

        mono_rps = []
        micro_rps = []

        for scenario in self.scenarios:
            if scenario in self.results['monolith']:
                m = self.extract_metrics(self.results['monolith'][scenario])
                mono_rps.append(m['requests_per_sec'])

            if scenario in self.results['microservices']:
                m = self.extract_metrics(self.results['microservices'][scenario])
                micro_rps.append(m['requests_per_sec'])

        x = np.arange(len(self.scenario_labels))

        fig, ax = plt.subplots(figsize=(12, 6))

        # Line chart instead of bar chart
        line1 = ax.plot(x, mono_rps, marker='o', linewidth=2.5, markersize=8,
                        label='Монолит', color='#3498db', alpha=0.9)
        line2 = ax.plot(x, micro_rps, marker='s', linewidth=2.5, markersize=8,
                        label='Микросервиси', color='#9b59b6', alpha=0.9)

        ax.set_xlabel('Оптерећење', fontsize=12, fontweight='bold')
        ax.set_ylabel('Захтева у секунди', fontsize=12, fontweight='bold')
        ax.set_title('Поређење пропусности: Монолит vs Микросервиси',
                     fontsize=14, fontweight='bold')
        ax.set_xticks(x)
        ax.set_xticklabels(self.scenario_labels)
        ax.legend(fontsize=11, loc='upper left')
        ax.grid(True, alpha=0.3, linestyle='--')

        # Add value labels on points
        for i, (mono_val, micro_val) in enumerate(zip(mono_rps, micro_rps)):
            ax.text(i, mono_val, f'{mono_val:.2f}', ha='center', va='bottom',
                   fontsize=9, fontweight='bold')
            ax.text(i, micro_val, f'{micro_val:.2f}', ha='center', va='bottom',
                   fontsize=9, fontweight='bold')

        plt.tight_layout()
        plt.savefig('graph-throughput.png', dpi=300, bbox_inches='tight')
        print("  Saved: graph-throughput.png")
        plt.close()

    def generate_error_rate_graph(self):
        """Generate error rate comparison graph"""
        print("\nGenerating error rate graph...")

        mono_errors = []
        micro_errors = []

        for scenario in self.scenarios:
            if scenario in self.results['monolith']:
                m = self.extract_metrics(self.results['monolith'][scenario])
                error_rate = (m['failed_count'] / m['requests_total'] * 100) if m['requests_total'] > 0 else 0
                mono_errors.append(error_rate)

            if scenario in self.results['microservices']:
                m = self.extract_metrics(self.results['microservices'][scenario])
                error_rate = (m['failed_count'] / m['requests_total'] * 100) if m['requests_total'] > 0 else 0
                micro_errors.append(error_rate)

        x = np.arange(len(self.scenario_labels))

        fig, ax = plt.subplots(figsize=(12, 6))

        # Line chart instead of bar chart
        line1 = ax.plot(x, mono_errors, marker='o', linewidth=2.5, markersize=8,
                        label='Монолит', color='#27ae60', alpha=0.9)
        line2 = ax.plot(x, micro_errors, marker='s', linewidth=2.5, markersize=8,
                        label='Микросервиси', color='#c0392b', alpha=0.9)

        ax.set_xlabel('Оптерећење', fontsize=12, fontweight='bold')
        ax.set_ylabel('Стопа грешака (%)', fontsize=12, fontweight='bold')
        ax.set_title('Поређење стопе грешака: Монолит vs Микросервиси',
                     fontsize=14, fontweight='bold')
        ax.set_xticks(x)
        ax.set_xticklabels(self.scenario_labels)
        ax.legend(fontsize=11, loc='upper left')
        ax.grid(True, alpha=0.3, linestyle='--')
        ax.set_ylim(-2, max(max(mono_errors + micro_errors) + 5, 30))

        # Add value labels on points
        for i, (mono_val, micro_val) in enumerate(zip(mono_errors, micro_errors)):
            ax.text(i, mono_val, f'{mono_val:.1f}%', ha='center', va='bottom',
                   fontsize=9, fontweight='bold')
            ax.text(i, micro_val, f'{micro_val:.1f}%', ha='center', va='bottom',
                   fontsize=9, fontweight='bold')

        plt.tight_layout()
        plt.savefig('graph-error-rate.png', dpi=300, bbox_inches='tight')
        print("  Saved: graph-error-rate.png")
        plt.close()

    def generate_p95_comparison_graph(self):
        """Generate P95 response time comparison graph"""
        print("\nGenerating P95 response time graph...")

        mono_p95 = []
        micro_p95 = []

        for scenario in self.scenarios:
            if scenario in self.results['monolith']:
                m = self.extract_metrics(self.results['monolith'][scenario])
                mono_p95.append(m['response_p95'])

            if scenario in self.results['microservices']:
                m = self.extract_metrics(self.results['microservices'][scenario])
                micro_p95.append(m['response_p95'])

        x = np.arange(len(self.scenario_labels))

        fig, ax = plt.subplots(figsize=(12, 6))

        # Line chart instead of bar chart
        line1 = ax.plot(x, mono_p95, marker='o', linewidth=2.5, markersize=8,
                        label='Монолит (P95)', color='#16a085', alpha=0.9)
        line2 = ax.plot(x, micro_p95, marker='s', linewidth=2.5, markersize=8,
                        label='Микросервиси (P95)', color='#d35400', alpha=0.9)

        ax.set_xlabel('Оптерећење', fontsize=12, fontweight='bold')
        ax.set_ylabel('P95 време одзива (ms)', fontsize=12, fontweight='bold')
        ax.set_title('Поређење P95 времена одзива: Монолит vs Микросервиси',
                     fontsize=14, fontweight='bold')
        ax.set_xticks(x)
        ax.set_xticklabels(self.scenario_labels)
        ax.legend(fontsize=11, loc='upper left')
        ax.grid(True, alpha=0.3, linestyle='--')

        # Add value labels on points
        for i, (mono_val, micro_val) in enumerate(zip(mono_p95, micro_p95)):
            ax.text(i, mono_val, f'{mono_val:.1f}ms', ha='center', va='bottom',
                   fontsize=9, fontweight='bold')
            ax.text(i, micro_val, f'{micro_val:.1f}ms', ha='center', va='bottom',
                   fontsize=9, fontweight='bold')

        plt.tight_layout()
        plt.savefig('graph-p95-response-time.png', dpi=300, bbox_inches='tight')
        print("  Saved: graph-p95-response-time.png")
        plt.close()

    def run(self):
        """Run the complete analysis"""
        print("=" * 80)
        print("PERFORMANCE TEST GRAPH GENERATOR")
        print("=" * 80)

        if not self.load_results():
            print("\nERROR: Failed to load results!")
            return False

        print("\n" + "=" * 80)
        print("GENERATING GRAPHS")
        print("=" * 80)

        self.generate_response_time_graph()
        self.generate_throughput_graph()
        self.generate_error_rate_graph()
        self.generate_p95_comparison_graph()

        print("\n" + "=" * 80)
        print("COMPLETE!")
        print("=" * 80)
        print("\nGenerated 4 graphs:")
        print("  1. graph-response-time.png")
        print("  2. graph-throughput.png")
        print("  3. graph-error-rate.png")
        print("  4. graph-p95-response-time.png")
        print("\nYou can now use these graphs in your thesis!")
        print("=" * 80 + "\n")

        return True

if __name__ == "__main__":
    generator = GraphGenerator()
    generator.run()
