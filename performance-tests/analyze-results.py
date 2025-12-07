#!/usr/bin/env python3
"""
Performance Test Analysis Script
Analyzes K6 test results and generates comparison report with graphs

Author: Dusan
Date: 2025-10-21
Purpose: University Thesis - Monolith vs Microservices Comparison
"""

import json
import glob
import matplotlib.pyplot as plt
import numpy as np
from datetime import datetime
import os

class PerformanceAnalyzer:
    """Analyzes performance test results and generates visualizations"""

    def __init__(self):
        self.results = {
            'monolith': {},
            'microservices': {}
        }
        self.scenarios = ['light_load', 'medium_load', 'heavy_load']

    def load_results(self):
        """Load all test result JSON files"""
        print("📂 Loading test results...")

        result_files = glob.glob('results-*.json')

        if not result_files:
            print("❌ No result files found!")
            print("   Run tests first: ./run-comparison-tests.ps1")
            return False

        for file in result_files:
            try:
                with open(file, 'r') as f:
                    data = json.load(f)

                    # Extract architecture and scenario from filename
                    # Format: results-{architecture}-{scenario}.json
                    parts = file.replace('results-', '').replace('.json', '').split('-')

                    if len(parts) >= 2:
                        architecture = parts[0]
                        scenario = '_'.join(parts[1:])

                        if architecture in self.results:
                            self.results[architecture][scenario] = data
                            print(f"  ✓ Loaded: {architecture} - {scenario}")

            except Exception as e:
                print(f"  ⚠️  Error loading {file}: {e}")

        return True

    def extract_metrics(self, data):
        """Extract key metrics from test data"""
        metrics = data.get('metrics', {})

        return {
            'avg_response_time': metrics.get('http_req_duration', {}).get('values', {}).get('avg', 0),
            'median_response_time': metrics.get('http_req_duration', {}).get('values', {}).get('med', 0),
            'p95_response_time': metrics.get('http_req_duration', {}).get('values', {}).get('p(95)', 0),
            'p99_response_time': metrics.get('http_req_duration', {}).get('values', {}).get('p(99)', 0),
            'max_response_time': metrics.get('http_req_duration', {}).get('values', {}).get('max', 0),
            'min_response_time': metrics.get('http_req_duration', {}).get('values', {}).get('min', 0),
            'throughput': metrics.get('http_reqs', {}).get('values', {}).get('rate', 0),
            'total_requests': metrics.get('http_reqs', {}).get('values', {}).get('count', 0),
            'error_rate': (metrics.get('errors', {}).get('values', {}).get('rate', 0)) * 100,
            'success_rate': (1 - metrics.get('errors', {}).get('values', {}).get('rate', 0)) * 100,
            'data_received_mb': metrics.get('data_received', {}).get('values', {}).get('count', 0) / 1024 / 1024,
        }

    def generate_comparison_graphs(self):
        """Generate comparison graphs for thesis"""
        print("\n📊 Generating comparison graphs...")

        # Prepare data for plotting
        scenarios_labels = {
            'light_load': '5 Users',
            'medium_load': '20 Users',
            'heavy_load': '50 Users'
        }

        mono_data = {}
        micro_data = {}

        for scenario in self.scenarios:
            if scenario in self.results['monolith']:
                mono_data[scenario] = self.extract_metrics(self.results['monolith'][scenario])
            if scenario in self.results['microservices']:
                micro_data[scenario] = self.extract_metrics(self.results['microservices'][scenario])

        # Create figure with subplots
        fig = plt.figure(figsize=(16, 12))
        fig.suptitle('Monolith vs Microservices Performance Comparison', fontsize=16, fontweight='bold')

        # 1. Average Response Time
        ax1 = plt.subplot(2, 3, 1)
        self._plot_comparison(ax1, mono_data, micro_data, 'avg_response_time',
                              'Average Response Time (ms)', scenarios_labels)

        # 2. 95th Percentile Response Time
        ax2 = plt.subplot(2, 3, 2)
        self._plot_comparison(ax2, mono_data, micro_data, 'p95_response_time',
                              '95th Percentile Response Time (ms)', scenarios_labels)

        # 3. Throughput (Requests/second)
        ax3 = plt.subplot(2, 3, 3)
        self._plot_comparison(ax3, mono_data, micro_data, 'throughput',
                              'Throughput (requests/second)', scenarios_labels)

        # 4. Error Rate
        ax4 = plt.subplot(2, 3, 4)
        self._plot_comparison(ax4, mono_data, micro_data, 'error_rate',
                              'Error Rate (%)', scenarios_labels)

        # 5. Response Time Distribution
        ax5 = plt.subplot(2, 3, 5)
        self._plot_response_distribution(ax5, mono_data, micro_data, scenarios_labels)

        # 6. Summary Table
        ax6 = plt.subplot(2, 3, 6)
        self._plot_summary_table(ax6, mono_data, micro_data, scenarios_labels)

        plt.tight_layout()
        plt.savefig('performance-comparison-graphs.png', dpi=300, bbox_inches='tight')
        print("  ✓ Saved: performance-comparison-graphs.png")

        # Generate individual graphs for thesis
        self._generate_individual_graphs(mono_data, micro_data, scenarios_labels)

    def _plot_comparison(self, ax, mono_data, micro_data, metric, title, labels):
        """Plot comparison bar chart"""
        x = np.arange(len(labels))
        width = 0.35

        mono_values = [mono_data.get(s, {}).get(metric, 0) for s in self.scenarios]
        micro_values = [micro_data.get(s, {}).get(metric, 0) for s in self.scenarios]

        ax.bar(x - width/2, mono_values, width, label='Monolith', color='#3498db')
        ax.bar(x + width/2, micro_values, width, label='Microservices', color='#e74c3c')

        ax.set_xlabel('User Load')
        ax.set_ylabel(title)
        ax.set_title(title)
        ax.set_xticks(x)
        ax.set_xticklabels([labels[s] for s in self.scenarios])
        ax.legend()
        ax.grid(axis='y', alpha=0.3)

        # Add value labels on bars
        for i, v in enumerate(mono_values):
            ax.text(i - width/2, v, f'{v:.1f}', ha='center', va='bottom', fontsize=8)
        for i, v in enumerate(micro_values):
            ax.text(i + width/2, v, f'{v:.1f}', ha='center', va='bottom', fontsize=8)

    def _plot_response_distribution(self, ax, mono_data, micro_data, labels):
        """Plot response time distribution"""
        scenarios_list = list(labels.values())

        # Use medium load for distribution comparison
        scenario = 'medium_load'

        if scenario in mono_data and scenario in micro_data:
            mono = mono_data[scenario]
            micro = micro_data[scenario]

            categories = ['Min', 'Avg', 'Median', 'P95', 'P99', 'Max']
            mono_times = [
                mono.get('min_response_time', 0),
                mono.get('avg_response_time', 0),
                mono.get('median_response_time', 0),
                mono.get('p95_response_time', 0),
                mono.get('p99_response_time', 0),
                mono.get('max_response_time', 0)
            ]
            micro_times = [
                micro.get('min_response_time', 0),
                micro.get('avg_response_time', 0),
                micro.get('median_response_time', 0),
                micro.get('p95_response_time', 0),
                micro.get('p99_response_time', 0),
                micro.get('max_response_time', 0)
            ]

            x = np.arange(len(categories))
            width = 0.35

            ax.bar(x - width/2, mono_times, width, label='Monolith', color='#3498db')
            ax.bar(x + width/2, micro_times, width, label='Microservices', color='#e74c3c')

            ax.set_xlabel('Percentile')
            ax.set_ylabel('Response Time (ms)')
            ax.set_title(f'Response Time Distribution ({labels[scenario]})')
            ax.set_xticks(x)
            ax.set_xticklabels(categories)
            ax.legend()
            ax.grid(axis='y', alpha=0.3)

    def _plot_summary_table(self, ax, mono_data, micro_data, labels):
        """Plot summary table"""
        ax.axis('off')

        # Calculate averages
        mono_avg_response = np.mean([mono_data.get(s, {}).get('avg_response_time', 0) for s in self.scenarios])
        micro_avg_response = np.mean([micro_data.get(s, {}).get('avg_response_time', 0) for s in self.scenarios])
        response_diff = ((micro_avg_response - mono_avg_response) / mono_avg_response) * 100 if mono_avg_response > 0 else 0

        mono_avg_throughput = np.mean([mono_data.get(s, {}).get('throughput', 0) for s in self.scenarios])
        micro_avg_throughput = np.mean([micro_data.get(s, {}).get('throughput', 0) for s in self.scenarios])
        throughput_diff = ((micro_avg_throughput - mono_avg_throughput) / mono_avg_throughput) * 100 if mono_avg_throughput > 0 else 0

        table_data = [
            ['Metric', 'Monolith', 'Microservices', 'Difference'],
            ['Avg Response Time', f'{mono_avg_response:.1f} ms', f'{micro_avg_response:.1f} ms', f'{response_diff:+.1f}%'],
            ['Avg Throughput', f'{mono_avg_throughput:.1f} req/s', f'{micro_avg_throughput:.1f} req/s', f'{throughput_diff:+.1f}%'],
        ]

        table = ax.table(cellText=table_data, cellLoc='center', loc='center',
                         colWidths=[0.3, 0.25, 0.25, 0.2])
        table.auto_set_font_size(False)
        table.set_fontsize(10)
        table.scale(1, 2)

        # Style header row
        for i in range(4):
            table[(0, i)].set_facecolor('#3498db')
            table[(0, i)].set_text_props(weight='bold', color='white')

        ax.set_title('Performance Summary', fontweight='bold', pad=20)

    def _generate_individual_graphs(self, mono_data, micro_data, labels):
        """Generate individual graphs for thesis inclusion"""
        print("\n📈 Generating individual graphs...")

        # Graph 1: Response Time vs User Load
        plt.figure(figsize=(10, 6))
        x = [5, 20, 50]  # User loads
        mono_response = [mono_data.get(s, {}).get('avg_response_time', 0) for s in self.scenarios]
        micro_response = [micro_data.get(s, {}).get('avg_response_time', 0) for s in self.scenarios]

        plt.plot(x, mono_response, marker='o', linewidth=2, markersize=8, label='Monolith', color='#3498db')
        plt.plot(x, micro_response, marker='s', linewidth=2, markersize=8, label='Microservices', color='#e74c3c')

        plt.xlabel('Number of Concurrent Users', fontsize=12)
        plt.ylabel('Average Response Time (ms)', fontsize=12)
        plt.title('Response Time vs User Load', fontsize=14, fontweight='bold')
        plt.legend(fontsize=11)
        plt.grid(True, alpha=0.3)
        plt.tight_layout()
        plt.savefig('graph-response-time-vs-users.png', dpi=300)
        print("  ✓ Saved: graph-response-time-vs-users.png")

        # Graph 2: Throughput vs User Load
        plt.figure(figsize=(10, 6))
        mono_throughput = [mono_data.get(s, {}).get('throughput', 0) for s in self.scenarios]
        micro_throughput = [micro_data.get(s, {}).get('throughput', 0) for s in self.scenarios]

        plt.plot(x, mono_throughput, marker='o', linewidth=2, markersize=8, label='Monolith', color='#3498db')
        plt.plot(x, micro_throughput, marker='s', linewidth=2, markersize=8, label='Microservices', color='#e74c3c')

        plt.xlabel('Number of Concurrent Users', fontsize=12)
        plt.ylabel('Throughput (requests/second)', fontsize=12)
        plt.title('Throughput vs User Load', fontsize=14, fontweight='bold')
        plt.legend(fontsize=11)
        plt.grid(True, alpha=0.3)
        plt.tight_layout()
        plt.savefig('graph-throughput-vs-users.png', dpi=300)
        print("  ✓ Saved: graph-throughput-vs-users.png")

    def generate_html_report(self):
        """Generate HTML report"""
        print("\n📄 Generating HTML report...")

        html = """
<!DOCTYPE html>
<html>
<head>
    <title>Performance Comparison Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #3498db; color: white; }
        tr:hover { background-color: #f5f5f5; }
        .mono { color: #3498db; font-weight: bold; }
        .micro { color: #e74c3c; font-weight: bold; }
        .better { color: #27ae60; }
        .worse { color: #e74c3c; }
        img { max-width: 100%; height: auto; margin: 20px 0; border: 1px solid #ddd; border-radius: 4px; }
        .metric-box { display: inline-block; margin: 10px; padding: 20px; background: #ecf0f1; border-radius: 8px; min-width: 200px; }
        .metric-box h3 { margin: 0 0 10px 0; color: #2c3e50; }
        .metric-box .value { font-size: 24px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <h1>QuizHub Performance Comparison Report</h1>
        <p><strong>Date:</strong> """ + datetime.now().strftime("%Y-%m-%d %H:%M:%S") + """</p>
        <p><strong>Test Scenarios:</strong> Light (5 users), Medium (20 users), Heavy (50 users)</p>

        <h2>📊 Visual Comparison</h2>
        <img src="performance-comparison-graphs.png" alt="Performance Comparison">

        <h2>📈 Key Findings</h2>
"""

        # Add summary metrics
        for scenario in self.scenarios:
            if scenario in self.results['monolith'] and scenario in self.results['microservices']:
                mono = self.extract_metrics(self.results['monolith'][scenario])
                micro = self.extract_metrics(self.results['microservices'][scenario])

                html += f"""
        <h3>{scenario.replace('_', ' ').title()}</h3>
        <table>
            <tr>
                <th>Metric</th>
                <th class="mono">Monolith</th>
                <th class="micro">Microservices</th>
                <th>Difference</th>
            </tr>
            <tr>
                <td>Average Response Time</td>
                <td>{mono['avg_response_time']:.2f} ms</td>
                <td>{micro['avg_response_time']:.2f} ms</td>
                <td class="{'better' if micro['avg_response_time'] < mono['avg_response_time'] else 'worse'}">
                    {((micro['avg_response_time'] - mono['avg_response_time']) / mono['avg_response_time'] * 100):+.1f}%
                </td>
            </tr>
            <tr>
                <td>95th Percentile</td>
                <td>{mono['p95_response_time']:.2f} ms</td>
                <td>{micro['p95_response_time']:.2f} ms</td>
                <td class="{'better' if micro['p95_response_time'] < mono['p95_response_time'] else 'worse'}">
                    {((micro['p95_response_time'] - mono['p95_response_time']) / mono['p95_response_time'] * 100):+.1f}%
                </td>
            </tr>
            <tr>
                <td>Throughput</td>
                <td>{mono['throughput']:.2f} req/s</td>
                <td>{micro['throughput']:.2f} req/s</td>
                <td class="{'better' if micro['throughput'] > mono['throughput'] else 'worse'}">
                    {((micro['throughput'] - mono['throughput']) / mono['throughput'] * 100):+.1f}%
                </td>
            </tr>
            <tr>
                <td>Error Rate</td>
                <td>{mono['error_rate']:.2f}%</td>
                <td>{micro['error_rate']:.2f}%</td>
                <td class="{'better' if micro['error_rate'] < mono['error_rate'] else 'worse'}">
                    {(micro['error_rate'] - mono['error_rate']):+.2f}%
                </td>
            </tr>
        </table>
"""

        html += """
        <h2>🎓 Thesis Graphs</h2>
        <p>Individual graphs for thesis inclusion:</p>
        <img src="graph-response-time-vs-users.png" alt="Response Time vs Users">
        <img src="graph-throughput-vs-users.png" alt="Throughput vs Users">

        <h2>📝 Conclusion</h2>
        <p>This comparison demonstrates the performance characteristics and trade-offs between monolithic and microservices architectures under varying user loads.</p>
    </div>
</body>
</html>
"""

        with open('comparison-report.html', 'w', encoding='utf-8') as f:
            f.write(html)

        print("  ✓ Saved: comparison-report.html")

    def run_analysis(self):
        """Run complete analysis"""
        print("\n╔════════════════════════════════════════════╗")
        print("║   Performance Analysis Tool                ║")
        print("╚════════════════════════════════════════════╝\n")

        if not self.load_results():
            return False

        self.generate_comparison_graphs()
        self.generate_html_report()

        print("\n✅ Analysis complete!")
        print("\n📁 Generated files:")
        print("  - performance-comparison-graphs.png (all graphs)")
        print("  - graph-response-time-vs-users.png (thesis)")
        print("  - graph-throughput-vs-users.png (thesis)")
        print("  - comparison-report.html (full report)")

        print("\n📖 Open comparison-report.html in your browser to view results!")

        return True


if __name__ == '__main__':
    try:
        import matplotlib
        analyzer = PerformanceAnalyzer()
        analyzer.run_analysis()
    except ImportError:
        print("❌ Error: matplotlib is required")
        print("   Install with: pip install matplotlib")
        print("   Or: pip install matplotlib numpy")
