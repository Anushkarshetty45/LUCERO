import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import ReactFlow, { Node, Edge, Background, Controls } from 'reactflow'
import 'reactflow/dist/style.css'
import { getMindMap, createMindMap } from '../../services/pdfAnalysisApi'
import { generateMindMapPrompt } from '../../services/aiPrompts'
import { callGemini } from '../../services/gemini'
import type { PDFMindMap, GenerateMindMapResponse } from '../../types/pdfAnalysis'

interface MindMapTabProps {
  analysisId: string
  pdfContent: string
}

export default function MindMapTab({ analysisId, pdfContent }: MindMapTabProps) {
  const { t } = useTranslation()
  const [mindMap, setMindMap] = useState<PDFMindMap | null>(null)
  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [generating, setGenerating] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMindMap()
  }, [analysisId])

  const loadMindMap = async () => {
    try {
      setLoading(true)
      const map = await getMindMap(analysisId)
      if (map) {
        setMindMap(map)
        convertToReactFlow(map.map_data)
      }
    } catch (err) {
      console.error('Load mind map error:', err)
    } finally {
      setLoading(false)
    }
  }

  const convertToReactFlow = (mapData: any) => {
    const newNodes: Node[] = []
    const newEdges: Edge[] = []

    // Calculate canvas center
    const centerX = 500
    const centerY = 400

    // Central node
    newNodes.push({
      id: '0',
      data: { label: mapData.central_topic },
      position: { x: centerX - 100, y: centerY - 40 },
      style: {
        background: 'var(--accent-primary)',
        color: 'var(--bg-primary)',
        padding: 20,
        borderRadius: 12,
        fontSize: 16,
        fontWeight: 'bold',
        width: 200,
        textAlign: 'center',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      }
    })

    // Branch nodes with better spacing
    const branchCount = mapData.branches.length
    const branchRadius = 350 // Increased from 300
    const angleStep = (2 * Math.PI) / branchCount

    mapData.branches.forEach((branch: any, bIdx: number) => {
      const branchId = `branch-${bIdx}`
      const angle = bIdx * angleStep - Math.PI / 2 // Start from top

      const branchX = centerX + branchRadius * Math.cos(angle) - 75
      const branchY = centerY + branchRadius * Math.sin(angle) - 30

      newNodes.push({
        id: branchId,
        data: { label: branch.topic },
        position: { x: branchX, y: branchY },
        style: {
          background: 'var(--accent-secondary)',
          color: 'var(--bg-primary)',
          padding: 12,
          borderRadius: 8,
          fontSize: 13,
          fontWeight: '600',
          width: 150,
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }
      })

      newEdges.push({
        id: `e0-${branchId}`,
        source: '0',
        target: branchId,
        animated: false,
        style: { stroke: 'var(--accent-primary)', strokeWidth: 2 }
      })

      // Subtopic nodes with improved layout
      const subtopicCount = branch.subtopics.length
      const subtopicRadius = 220 // Increased spacing

      branch.subtopics.forEach((subtopic: string, sIdx: number) => {
        const subtopicId = `${branchId}-sub-${sIdx}`

        // Spread subtopics in an arc around the branch
        const arcSpan = Math.PI / 2.5 // Smaller arc for better organization
        const subtopicAngle = angle + ((sIdx - (subtopicCount - 1) / 2) * (arcSpan / Math.max(subtopicCount - 1, 1)))

        const subtopicX = centerX + (branchRadius + subtopicRadius) * Math.cos(subtopicAngle) - 65
        const subtopicY = centerY + (branchRadius + subtopicRadius) * Math.sin(subtopicAngle) - 20

        newNodes.push({
          id: subtopicId,
          data: { label: subtopic },
          position: { x: subtopicX, y: subtopicY },
          style: {
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            padding: 8,
            borderRadius: 6,
            fontSize: 11,
            width: 130,
            textAlign: 'center',
            border: '2px solid var(--border-color)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
          }
        })

        newEdges.push({
          id: `e${branchId}-${subtopicId}`,
          source: branchId,
          target: subtopicId,
          style: { stroke: 'var(--border-color)', strokeWidth: 1.5 }
        })
      })
    })

    setNodes(newNodes)
    setEdges(newEdges)
  }

  const generateMindMapData = async () => {
    setGenerating(true)

    if (!pdfContent || pdfContent.trim().length === 0) {
      alert(t('pdfAnalyzer.common.errorNoPDFContent'))
      setGenerating(false)
      return
    }

    try {
      const prompt = generateMindMapPrompt(pdfContent.substring(0, 10000))
      const aiResponse = await callGemini(prompt)

      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed: GenerateMindMapResponse = JSON.parse(jsonMatch[0])
        const map = await createMindMap(analysisId, parsed)
        setMindMap(map)
        convertToReactFlow(parsed)
      }
    } catch (err) {
      console.error('Generate mind map error:', err)
      alert(t('pdfAnalyzer.mindmap.errorGenerate'))
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return <div className="tab-loading"><div className="spinner"></div><p>{t('pdfAnalyzer.mindmap.loading')}</p></div>
  }

  if (!mindMap) {
    return (
      <div className="mindmap-generate">
        <div className="generate-icon">
          <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <circle cx="5" cy="7" r="2"/>
            <circle cx="19" cy="7" r="2"/>
            <circle cx="5" cy="17" r="2"/>
            <circle cx="19" cy="17" r="2"/>
            <line x1="9.5" y1="11.5" x2="6.5" y2="8.5"/>
            <line x1="14.5" y1="11.5" x2="17.5" y2="8.5"/>
            <line x1="9.5" y1="12.5" x2="6.5" y2="15.5"/>
            <line x1="14.5" y1="12.5" x2="17.5" y2="15.5"/>
          </svg>
        </div>
        <h3>{t('pdfAnalyzer.mindmap.generateTitle')}</h3>
        <p>{t('pdfAnalyzer.mindmap.generateDescription')}</p>
        <button
          className="btn-generate"
          onClick={generateMindMapData}
          disabled={generating}
        >
          {generating ? t('pdfAnalyzer.mindmap.generating') : t('pdfAnalyzer.mindmap.generateButton')}
        </button>
      </div>
    )
  }

  return (
    <div className="mindmap-tab">
      <div className="mindmap-header">
        <h3>{t('pdfAnalyzer.mindmap.title')}</h3>
        <p>{t('pdfAnalyzer.mindmap.description')}</p>
      </div>

      <div className="mindmap-container" style={{ height: '600px' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          attributionPosition="bottom-right"
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  )
}
