import React, { useState, useRef, useEffect } from 'react';
import './DbDesigner.css';

type Table = {
  id: string;
  name: string;
  x: number;
  y: number;
  relationships: Relationship[];
};

type Relationship = {
  id: string;
  sourceTableId: string;
  targetTableId: string;
};

type DbDesignerProps = {};

const DbDesigner: React.FC<DbDesignerProps> = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const [connections, setConnections] = useState<Relationship[]>([]);
  const [draggedTable, setDraggedTable] = useState<Table | null>(null);
  const [draggedDot, setDraggedDot] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [editingTableId, setEditingTableId] = useState<string | null>(null);
  const [editingTableName, setEditingTableName] = useState<string>('');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const designerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleMouseUp = () => {
      if (draggedTable) {
        setDraggedTable(null);
      }
      if (draggedDot) {
        setDraggedDot(null);
      }
      setIsConnecting(false);
    };

    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggedTable, draggedDot]);

  const handleAddTable = (event: React.MouseEvent<HTMLButtonElement>) => {
    const newTable: Table = {
      id: String(tables.length + 1),
      name: 'New Table',
      x: event.clientX / zoomLevel,
      y: event.clientY / zoomLevel,
      relationships: [],
    };

    setTables((prevTables) => [...prevTables, newTable]);
  };

  const handleMouseDownTable = (table: Table) => {
    setDraggedTable(table);
  };

  const handleMouseMoveTable = (event: React.MouseEvent<HTMLDivElement>) => {
    if (draggedTable && designerRef.current) {
      const rect = designerRef.current.getBoundingClientRect();
      const x = (event.clientX - rect.left - 50) / zoomLevel; // adjust for table width
      const y = (event.clientY - rect.top - 25) / zoomLevel; // adjust for table height

      setTables((prevTables) =>
        prevTables.map((table) => (table.id === draggedTable.id ? { ...table, x, y } : table))
      );
    }
  };

  const handleMouseDownDot = (tableId: string) => {
    setDraggedDot(tableId);
    setIsConnecting(true);
  };

  const handleMouseUpDot = (tableId: string) => {
    if (isConnecting && draggedDot && draggedDot !== tableId) {
      const newRelationship: Relationship = {
        id: `${draggedDot}-${tableId}`,
        sourceTableId: draggedDot,
        targetTableId: tableId,
      };

      setConnections((prevConnections) => [...prevConnections, newRelationship]);
    }

    setDraggedDot(null);
    setIsConnecting(false);
  };

  const handleMouseOverDot = (tableId: string) => {
    if (isConnecting && draggedDot && draggedDot !== tableId) {
      setDraggedDot(tableId);
    }
  };

  const handleTableDoubleClick = (tableId: string, tableName: string) => {
    setEditingTableId(tableId);
    setEditingTableName(tableName);
    setIsEditing(true);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEditingTableName(event.target.value);
  };

  const handleInputBlur = () => {
    if (editingTableId && editingTableName.trim() !== '') {
      setTables((prevTables) =>
        prevTables.map((table) =>
          table.id === editingTableId ? { ...table, name: editingTableName } : table
        )
      );
    }

    setEditingTableId(null);
    setIsEditing(false);
  };

  const handleDeleteTable = (tableId: string) => {
    setTables((prevTables) => prevTables.filter((table) => table.id !== tableId));
    setConnections((prevConnections) =>
      prevConnections.filter(
        (relationship) =>
          relationship.sourceTableId !== tableId && relationship.targetTableId !== tableId
      )
    );
  };

  const handleZoomIn = () => {
    setZoomLevel((prevZoomLevel) => prevZoomLevel + 0.1);
  };

  const handleZoomOut = () => {
    setZoomLevel((prevZoomLevel) => Math.max(prevZoomLevel - 0.1, 0.1));
  };

  const handleZoomLevelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedZoomLevel = parseFloat(event.target.value) / 100;
    setZoomLevel(selectedZoomLevel);
  };

  const renderTable = (table: Table) => {
    const tableStyle: React.CSSProperties = {
      position: 'absolute',
      left: table.x * zoomLevel,
      top: table.y * zoomLevel,
      border: '1px solid #000',
      background: '#fff',
      padding: '8px',
      height:'auto',
      zIndex:"2",
      cursor: 'move',
      transform: `scale(${zoomLevel})`,
      transformOrigin: 'top left',
    };
  
    const isEditing = editingTableId === table.id;
  
    const addRelationshipHandler = () => {
      const newRelationship: Relationship = {
        id: `${table.id}-${tables[0].id}`, // Connect to the first table by default
        sourceTableId: table.id,
        targetTableId: tables[0].id,
      };
  
      setConnections((prevConnections) => [...prevConnections, newRelationship]);
    };
  
    const deleteTableHandler = () => {
      handleDeleteTable(table.id);
    };
  
    const handleEditClick = () => {
      setEditingTableId(table.id);
      setEditingTableName(table.name);
    };
  
    const handleSaveClick = () => {
      if (editingTableId && editingTableName.trim() !== '') {
        setTables((prevTables) =>
          prevTables.map((t) =>
            t.id === editingTableId ? { ...t, name: editingTableName } : t
          )
        );
      }
  
      setEditingTableId(null);
    };
  
    return (
      <div
        key={table.id}
        className={`table ${isEditing ? 'editing' : ''}`}
        style={tableStyle}
        onMouseDown={() => handleMouseDownTable(table)}
        onMouseMove={handleMouseMoveTable}
        onDoubleClick={() => handleTableDoubleClick(table.id, table.name)}
      >
        {isEditing ? (
          <div className="table-editing">
            <input
              ref={inputRef}
              type="text"
              value={editingTableName}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              autoFocus
            />
            <button className="table-save-button" onClick={handleSaveClick}>
              Save
            </button>
          </div>
        ) : (
          <div className="table-display">
            <h3>{table.name}</h3>
            {tables.length > 1 && (
              <select
                value={table.relationships.length > 0 ? table.relationships[0].targetTableId : ''}
                onChange={(event) =>
                  handleChangeRelationship(event, table.relationships[0]?.id, table.id)
                }
              >
                {tables
                  .filter((t) => t.id !== table.id)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
              </select>
            )}
            <button className="add-relationship-button" onClick={addRelationshipHandler}>
              Add Relationship
            </button>
            <button className="delete-button" onClick={deleteTableHandler}>
              Delete
            </button>
            <button className="edit-button" onClick={handleEditClick}>
              Edit
            </button>
          </div>
        )}
      </div>
    );
  };
  

  const renderConnection = (relationship: Relationship) => {
    const sourceTable = tables.find((table) => table.id === relationship.sourceTableId);
    const targetTable = tables.find((table) => table.id === relationship.targetTableId);

    if (!sourceTable || !targetTable) {
      return null;
    }

    const sourceX = sourceTable.x * zoomLevel + 50; // Adjust for dot position
    const sourceY = sourceTable.y * zoomLevel + 50; // Adjust for dot position
    const targetX = targetTable.x * zoomLevel + 50; // Adjust for dot position
    const targetY = targetTable.y * zoomLevel + 50; // Adjust for dot position

    const deltaX = targetX - sourceX;
    const deltaY = targetY - sourceY;
    const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

    const lineStyle: React.CSSProperties = {
      position: 'absolute',
      zIndex: 1,
      transform: `rotate(${angle}deg)`,
      width: `${length}px`,
      top: `${sourceY}px`,
      left: `${sourceX}px`,
    };

    return (
      <div key={relationship.id} className="relationship" style={lineStyle}>
        <svg className="line" width={length} height="2">
          <line x1="0" y1="1" x2={length} y2="1" stroke="black" strokeWidth="2" />
        </svg>
      </div>
    );
  };

  const handleChangeRelationship = (
    event: React.ChangeEvent<HTMLSelectElement>,
    relationshipId: string,
    tableId: string
  ) => {
    const newConnections = connections.map((relationship) => {
      if (relationship.id === relationshipId) {
        return { ...relationship, targetTableId: event.target.value };
      }
      return relationship;
    });

    setConnections(newConnections);

    setTables((prevTables) =>
      prevTables.map((table) => {
        if (table.id === tableId) {
          return {
            ...table,
            relationships: [
              { ...table.relationships[0], targetTableId: event.target.value },
            ],
          };
        }
        return table;
      })
    );
  };

  return (
    <div>
      <div className="header">
        <h2>Database Designer</h2>
        <div className="toolbar">
          <button className="toolbar-button" onClick={handleAddTable}>
            Add New
          </button>
          <button className="toolbar-button" onClick={handleZoomIn}>
            +
          </button>
          <button className="toolbar-button" onClick={handleZoomOut}>
            -
          </button>
          <select
            className="zoom-select"
            value={`${zoomLevel * 100}%`}
            onChange={(event) => handleZoomLevelChange(event)}
          >
            <option value="125%">125%</option>
            <option value="100%">100%</option>
            <option value="80%">80%</option>
            <option value="70%">70%</option>
          </select>
        </div>
      </div>
      <div
        ref={designerRef}
        className="designer"
        style={{ width: '100%', height: '600px', position: 'relative' }}
      >
        {tables.map(renderTable)}
        {connections.map(renderConnection)}
      </div>
    </div>
  );
};

export default DbDesigner;
