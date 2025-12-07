#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Performance Test Analysis Script - Serbian Cyrillic Output
Analyzes K6 test results and generates comparison report with graphs in Serbian

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

# Configure matplotlib for Cyrillic
plt.rcParams['font.family'] = 'DejaVu Sans'

class PerformanceAnalyzer:
    """Analyzes performance test results and generates visualizations in Serbian"""

    def __init__(self):
        self.results = {
            'monolith': {},
            'microservices': {}
        }
        self.scenarios = ['light_load', 'medium_load', 'heavy_load']
        self.scenario_names = {
            'light_load': 'Лако оптерећење (5 корисника)',
            'medium_load': 'Средње оптерећење (20 корисника)',
            'heavy_load': 'Тешко оптерећење (50 корисника)'
        }

    def load_results(self):
        """Load all test result JSON files"""
        print("📂 Учитавање резултата тестирања...")

        result_files = glob.glob('results-*.json')

        if not result_files:
            print("❌ Није пронађен ниједан фајл са резултатима!")
            print("   Прво покрените тестове: ./run-comparison-tests.ps1")
            return False

        for file in result_files:
            try:
                with open(file, 'r', encoding='utf-8') as f:
                    data = json.load(f)

                    # Extract architecture and scenario from filename
                    parts = file.replace('results-', '').replace('.json', '').split('-')

                    if len(parts) >= 2:
                        architecture = parts[0]
                        scenario = '_'.join(parts[1:])

                        if architecture in self.results:
                            self.results[architecture][scenario] = data
                            print(f"  ✓ Учитано: {architecture} - {self.scenario_names.get(scenario, scenario)}")

            except Exception as e:
                print(f"  ⚠️  Грешка при учитавању {file}: {e}")

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
        """Generate comparison graphs for thesis in Serbian"""
        print("\n📊 Генерисање графикона поређења...")

        scenario_labels = {
            'light_load': '5 корисника',
            'medium_load': '20 корисника',
            'heavy_load': '50 корисника'
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
        fig.suptitle('Поређење перформанси: Монолит vs Микросервиси', fontsize=16, fontweight='bold')

        # 1. Average Response Time
        ax1 = plt.subplot(2, 3, 1)
        self._plot_comparison(ax1, mono_data, micro_data, 'avg_response_time',
                              'Просечно време одзива (ms)', scenario_labels)

        # 2. 95th Percentile Response Time
        ax2 = plt.subplot(2, 3, 2)
        self._plot_comparison(ax2, mono_data, micro_data, 'p95_response_time',
                              '95. перцентил време одзива (ms)', scenario_labels)

        # 3. Throughput (Requests/second)
        ax3 = plt.subplot(2, 3, 3)
        self._plot_comparison(ax3, mono_data, micro_data, 'throughput',
                              'Пропусност (захтева/сек)', scenario_labels)

        # 4. Error Rate
        ax4 = plt.subplot(2, 3, 4)
        self._plot_comparison(ax4, mono_data, micro_data, 'error_rate',
                              'Стопа грешака (%)', scenario_labels)

        # 5. Response Time Distribution
        ax5 = plt.subplot(2, 3, 5)
        self._plot_response_distribution(ax5, mono_data, micro_data, scenario_labels)

        # 6. Summary Table
        ax6 = plt.subplot(2, 3, 6)
        self._plot_summary_table(ax6, mono_data, micro_data, scenario_labels)

        plt.tight_layout()
        plt.savefig('графикони-поређења-перформанси.png', dpi=300, bbox_inches='tight')
        print("  ✓ Сачувано: графикони-поређења-перформанси.png")

        # Generate individual graphs for thesis
        self._generate_individual_graphs(mono_data, micro_data, scenario_labels)

    def _plot_comparison(self, ax, mono_data, micro_data, metric, title, labels):
        """Plot comparison bar chart"""
        x = np.arange(len(labels))
        width = 0.35

        mono_values = [mono_data.get(s, {}).get(metric, 0) for s in self.scenarios]
        micro_values = [micro_data.get(s, {}).get(metric, 0) for s in self.scenarios]

        ax.bar(x - width/2, mono_values, width, label='Монолит', color='#3498db')
        ax.bar(x + width/2, micro_values, width, label='Микросервиси', color='#e74c3c')

        ax.set_xlabel('Оптерећење корисника')
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
        scenario = 'medium_load'

        if scenario in mono_data and scenario in micro_data:
            mono = mono_data[scenario]
            micro = micro_data[scenario]

            categories = ['Мин', 'Прос', 'Мед', 'П95', 'П99', 'Макс']
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

            ax.bar(x - width/2, mono_times, width, label='Монолит', color='#3498db')
            ax.bar(x + width/2, micro_times, width, label='Микросервиси', color='#e74c3c')

            ax.set_xlabel('Перцентил')
            ax.set_ylabel('Време одзива (ms)')
            ax.set_title(f'Дистрибуција времена одзива ({labels[scenario]})')
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
            ['Метрика', 'Монолит', 'Микросервиси', 'Разлика'],
            ['Прос. време одзива', f'{mono_avg_response:.1f} ms', f'{micro_avg_response:.1f} ms', f'{response_diff:+.1f}%'],
            ['Прос. пропусност', f'{mono_avg_throughput:.1f} зах/с', f'{micro_avg_throughput:.1f} зах/с', f'{throughput_diff:+.1f}%'],
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

        ax.set_title('Резиме перформанси', fontweight='bold', pad=20)

    def _generate_individual_graphs(self, mono_data, micro_data, labels):
        """Generate individual graphs for thesis inclusion"""
        print("\n📈 Генерисање појединачних графикона...")

        # Graph 1: Response Time vs User Load
        plt.figure(figsize=(10, 6))
        x = [5, 20, 50]  # User loads
        mono_response = [mono_data.get(s, {}).get('avg_response_time', 0) for s in self.scenarios]
        micro_response = [micro_data.get(s, {}).get('avg_response_time', 0) for s in self.scenarios]

        plt.plot(x, mono_response, marker='o', linewidth=2, markersize=8, label='Монолит', color='#3498db')
        plt.plot(x, micro_response, marker='s', linewidth=2, markersize=8, label='Микросервиси', color='#e74c3c')

        plt.xlabel('Број истовремених корисника', fontsize=12)
        plt.ylabel('Просечно време одзива (ms)', fontsize=12)
        plt.title('Време одзива у односу на број корисника', fontsize=14, fontweight='bold')
        plt.legend(fontsize=11)
        plt.grid(True, alpha=0.3)
        plt.tight_layout()
        plt.savefig('график-време-одзива-корисници.png', dpi=300)
        print("  ✓ Сачувано: график-време-одзива-корисници.png")

        # Graph 2: Throughput vs User Load
        plt.figure(figsize=(10, 6))
        mono_throughput = [mono_data.get(s, {}).get('throughput', 0) for s in self.scenarios]
        micro_throughput = [micro_data.get(s, {}).get('throughput', 0) for s in self.scenarios]

        plt.plot(x, mono_throughput, marker='o', linewidth=2, markersize=8, label='Монолит', color='#3498db')
        plt.plot(x, micro_throughput, marker='s', linewidth=2, markersize=8, label='Микросервиси', color='#e74c3c')

        plt.xlabel('Број истовремених корисника', fontsize=12)
        plt.ylabel('Пропусност (захтева/секунда)', fontsize=12)
        plt.title('Пропусност у односу на број корисника', fontsize=14, fontweight='bold')
        plt.legend(fontsize=11)
        plt.grid(True, alpha=0.3)
        plt.tight_layout()
        plt.savefig('график-пропусност-корисници.png', dpi=300)
        print("  ✓ Сачувано: график-пропусност-корисници.png")

    def generate_html_report(self):
        """Generate HTML report in Serbian"""
        print("\n📄 Генерисање HTML извештаја...")

        html = f"""
<!DOCTYPE html>
<html lang="sr">
<head>
    <meta charset="UTF-8">
    <title>Извештај поређења перформанси</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }}
        .container {{ max-width: 1200px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
        h1 {{ color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }}
        h2 {{ color: #34495e; margin-top: 30px; }}
        table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
        th, td {{ padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }}
        th {{ background-color: #3498db; color: white; }}
        tr:hover {{ background-color: #f5f5f5; }}
        .моно {{ color: #3498db; font-weight: bold; }}
        .микро {{ color: #e74c3c; font-weight: bold; }}
        .боље {{ color: #27ae60; }}
        .горе {{ color: #e74c3c; }}
        img {{ max-width: 100%; height: auto; margin: 20px 0; border: 1px solid #ddd; border-radius: 4px; }}
    </style>
</head>
<body>
    <div class="container">
        <h1>Извештај поређења перформанси КвизХаб апликације</h1>
        <p><strong>Датум:</strong> {datetime.now().strftime("%d.%m.%Y. %H:%M:%S")}</p>
        <p><strong>Сценарији тестирања:</strong> Лако (5 корисника), Средње (20 корисника), Тешко (50 корисника)</p>

        <h2>📊 Визуелно поређење</h2>
        <img src="графикони-поређења-перформанси.png" alt="Поређење перформанси">

        <h2>📈 Кључни налази</h2>
"""

        # Add summary metrics
        for scenario in self.scenarios:
            if scenario in self.results['monolith'] and scenario in self.results['microservices']:
                mono = self.extract_metrics(self.results['monolith'][scenario])
                micro = self.extract_metrics(self.results['microservices'][scenario])

                html += f"""
        <h3>{self.scenario_names[scenario]}</h3>
        <table>
            <tr>
                <th>Метрика</th>
                <th class="моно">Монолит</th>
                <th class="микро">Микросервиси</th>
                <th>Разлика</th>
            </tr>
            <tr>
                <td>Просечно време одзива</td>
                <td>{mono['avg_response_time']:.2f} ms</td>
                <td>{micro['avg_response_time']:.2f} ms</td>
                <td class="{'боље' if micro['avg_response_time'] < mono['avg_response_time'] else 'горе'}">
                    {((micro['avg_response_time'] - mono['avg_response_time']) / mono['avg_response_time'] * 100):+.1f}%
                </td>
            </tr>
            <tr>
                <td>95. перцентил</td>
                <td>{mono['p95_response_time']:.2f} ms</td>
                <td>{micro['p95_response_time']:.2f} ms</td>
                <td class="{'боље' if micro['p95_response_time'] < mono['p95_response_time'] else 'горе'}">
                    {((micro['p95_response_time'] - mono['p95_response_time']) / mono['p95_response_time'] * 100):+.1f}%
                </td>
            </tr>
            <tr>
                <td>Пропусност</td>
                <td>{mono['throughput']:.2f} зах/с</td>
                <td>{micro['throughput']:.2f} зах/с</td>
                <td class="{'боље' if micro['throughput'] > mono['throughput'] else 'горе'}">
                    {((micro['throughput'] - mono['throughput']) / mono['throughput'] * 100):+.1f}%
                </td>
            </tr>
            <tr>
                <td>Стопа грешака</td>
                <td>{mono['error_rate']:.2f}%</td>
                <td>{micro['error_rate']:.2f}%</td>
                <td class="{'боље' if micro['error_rate'] < mono['error_rate'] else 'горе'}">
                    {(micro['error_rate'] - mono['error_rate']):+.2f}%
                </td>
            </tr>
        </table>
"""

        html += """
        <h2>🎓 Графикони за завршни рад</h2>
        <p>Појединачни графикони за укључивање у рад:</p>
        <img src="график-време-одзива-корисници.png" alt="Време одзива vs Корисници">
        <img src="график-пропусност-корисници.png" alt="Пропусност vs Корисници">

        <h2>📝 Закључак</h2>
        <p>Ово поређење показује карактеристике перформанси и компромисе између монолитне и микросервисне архитектуре под различитим оптерећењима корисника.</p>
    </div>
</body>
</html>
"""

        with open('извештај-поређења.html', 'w', encoding='utf-8') as f:
            f.write(html)

        print("  ✓ Сачувано: извештај-поређења.html")

    def run_analysis(self):
        """Run complete analysis"""
        print("\n╔════════════════════════════════════════════╗")
        print("║   Алат за анализу перформанси             ║")
        print("╚════════════════════════════════════════════╝\n")

        if not self.load_results():
            return False

        self.generate_comparison_graphs()
        self.generate_html_report()

        print("\n✅ Анализа завршена!")
        print("\n📁 Генерисани фајлови:")
        print("  - графикони-поређења-перформанси.png (сви графикони)")
        print("  - график-време-одзива-корисници.png (за рад)")
        print("  - график-пропусност-корисници.png (за рад)")
        print("  - извештај-поређења.html (комплетан извештај)")

        print("\n📖 Отворите извештај-поређења.html у претраживачу за преглед резултата!")

        return True


if __name__ == '__main__':
    try:
        import matplotlib
        analyzer = PerformanceAnalyzer()
        analyzer.run_analysis()
    except ImportError:
        print("❌ Грешка: потребан је matplotlib")
        print("   Инсталирајте са: pip install matplotlib")
        print("   Или: pip install matplotlib numpy")
