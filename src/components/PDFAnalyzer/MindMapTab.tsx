import { useState, useEffect } from 'react'
import ReactFlow, { Node, Edge, Background, Controls } from 'reactflow'
import 'reactflow/dist/style.css'
import { getMindMap, createMindMap } from '../../services/pdfAnalysisApi'
import { generateMindMapPrompt } from '../../services/aiPrompts'
import type { PDFMindMap, GenerateMindMapResponse } from '../../types/pdfAnalysis'

interface MindMapTabProps {
  analysisId: string
  pdfContent: string
}

export default function MindMapTab({ analysisId, pdfContent }: MindMapTabProps) {
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

    // Central node
    newNodes.push({
      id: '0',
      data: { label: mapData.central_topic },
      position: { x: 400, y: 300 },
      style: {
        background: '#667eea',
        color: 'white',
        padding: 20,
        borderRadius: 10,
        fontSize: 18,
        fontWeight: 'bold',
        width: 200,
        textAlign: 'center'
      }
    })

    // Branch nodes
    const angleStep = (2 * Math.PI) / mapData.branches.length
    mapData.branches.forEach((branch: any, bIdx: number) => {
      const branchId = `branch-${bIdx}`
      const angle = bIdx * angleStep
      const radius = 300

      newNodes.push({
        id: branchId,
        data: { label: branch.topic },
        position: {
          x: 400 + radius * Math.cos(angle),
          y: 300 + radius * Math.sin(angle)
        },
        style: {
          background: '#764ba2',
          color: 'white',
          padding: 15,
          borderRadius: 8,
          fontSize: 14,
          fontWeight: '600',
          width: 150,
          textAlign: 'center'
        }
      })

      newEdges.push({
        id: `e0-${branchId}`,
        source: '0',
        target: branchId,
        animated: true,
        style: { stroke: '#667eea', strokeWidth: 2 }
      })

      // Subtopic nodes
      branch.subtopics.forEach((subtopic: string, sIdx: number) => {
        const subtopicId = `${branchId}-sub-${sIdx}`
        const subAngle = angle + ((sIdx - (branch.subtopics.length - 1) / 2) * 0.3)
        const subRadius = 200

        newNodes.push({
          id: subtopicId,
          data: { label: subtopic },
          position: {
            x: 400 + radius * Math.cos(angle) + subRadius * Math.cos(subAngle),
            y: 300 + radius * Math.sin(angle) + subRadius * Math.sin(subAngle)
          },
          style: {
            background: '#ebeae8',
            color: '#000',
            padding: 10,
            borderRadius: 6,
            fontSize: 12,
            width: 130,
            textAlign: 'center'
          }
        })

        newEdges.push({
          id: `e${branchId}-${subtopicId}`,
          source: branchId,
          target: subtopicId,
          style: { stroke: '#999', strokeWidth: 1.5 }
        })
      })
    })

    setNodes(newNodes)
    setEdges(newEdges)
  }

  const generateMindMapData = async () => {
    setGenerating(true)
    try {
      const prompt = generateMindMapPrompt(pdfContent.substring(0, 10000))

      const response = await fetch(
        'http://localhost:3002/api/claude',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            prompt,
            maxTokens: 2000
          })
        }
      )

      const data = await response.json()
      const aiResponse = data.text

      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed: GenerateMindMapResponse = JSON.parse(jsonMatch[0])
        const map = await createMindMap(analysisId, parsed)
        setMindMap(map)
        convertToReactFlow(parsed)
      }
    } catch (err) {
      console.error('Generate mind map error:', err)
      alert('Failed to generate mind map. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return <div className="tab-loading"><div className="spinner"></div><p>Loading mind map...</p></div>
  }

  if (!mindMap) {
    return (
      <div className="mindmap-generate">
        <div className="generate-icon">🧠</div>
        <h3>Generate Mind Map</h3>
        <p>Create a visual mind map showing the relationships between concepts in this PDF.</p>
        <button
          className="btn-generate"
          onClick={generateMindMapData}
          disabled={generating}
        >
          {generating ? '⏳ Generating...' : '✨ Generate Mind Map'}
        </button>
      </div>
    )
  }

  return (
    <div className="mindmap-tab">
      <div className="mindmap-header">
        <h3>🧠 Mind Map</h3>
        <p>Explore the interconnected concepts from this PDF</p>
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
